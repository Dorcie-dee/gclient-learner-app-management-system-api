import axios from "axios";
import { createInvoiceValidator, updateInvoiceValidator } from "../validators/invoiceValidator.js";
import { learnerModel } from "../models/learnerModel.js";
import { trackModel } from "../models/trackModel.js";
import { invoiceModel } from "../models/invoiceModel.js";
import { generateInvoiceEmailTemplate, sendingEmail } from "../utils/mailing.js";



export const createInvoice = async (req, res) => {
  try {
    const { error, value } = createInvoiceValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const { learner, paystackCallbackUrl, amount, dueDate, paymentDetails } = value;

    const existingLearner = await learnerModel.findById(learner);
    if (!existingLearner || existingLearner.role !== 'Learner') {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    const relatedTrack = await trackModel.findOne().sort({ createdAt: -1 });
    if (!relatedTrack) {
      return res.status(400).json({
        success: false,
        message: 'No track found to associate with invoice'
      });
    }

    const invoiceAmount = amount || relatedTrack.price;
    const invoiceDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    //initialize Paystack Transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: existingLearner.email,
        amount: invoiceAmount * 100, // Paystack uses kobo
        callback_url: paystackCallbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentLink = response.data.data.authorization_url
    const paystackReference = response.data.data.reference;


    // Step 2: Create Invoice in DB
    const invoice = await invoiceModel.create({
      learner,
      track: relatedTrack._id,
      amount: invoiceAmount,
      dueDate: invoiceDueDate,
      paystackCallbackUrl,
      paymentLink,
      reference: paystackReference,
      // paymentReference: reference,
      paymentDetails,
    });


    const emailSubject = "Your Invoice is Ready - Complete Your Payment";
    const emailBody = generateInvoiceEmailTemplate
      .replace('{{firstName}}', existingLearner.firstName)
      .replace('{{amount}}', invoiceAmount)
      .replace(/{{paymentLink}}/g, invoice.paymentLink)
      .replace('{{paymentDetails}}', paymentDetails)
      .replace('{{dueDate}}', invoice.dueDate.toLocaleDateString());

    try {
      await sendingEmail(existingLearner.email, emailSubject, emailBody);
    }
    catch (invoiceEmailError) {
      //delete invoice since the email failed
      await invoiceModel.findByIdAndDelete(invoice._id);

      return res.status(500).json({
        success: false,
        message:
          "Invoice was created but failed to send email. The invoice has been removed. Please try again.",
        error: invoiceEmailError.message,
      });
    }

    const populatedInvoice = await invoiceModel.findById(invoice._id)
      .populate({ path: 'learner', select: '-password' })
      .populate({
        path: 'track',
        select: 'admin name price instructor duration image description createdAt updatedAt'
      })
      .lean();

    // Respond
    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully and email sent to learner',
      invoice: populatedInvoice,
    });

  }

  catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



//verify payment
export const verifyPayment = async (req, res) => {
  const { reference } = req.query;

  try {
    //verifying transaction from Paystack
    const { data } = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      });

    const paymentData = data.data;

    if (paymentData.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    //updating invoice in DB
    const invoice = await invoiceModel.findOneAndUpdate(
      { reference: paymentData.reference },
      {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentDetails: JSON.stringify(paymentData)
      },
      { new: true }
    );

    if (!invoice) {
      console.log('Reference not found in DB:', paymentData.reference);

      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.status(200).json({ message: 'Payment verified successfully', invoice });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};



//superadmin / only eligible admin can update invoice
export const updateInvoice = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    //validate update fields
    const { error } = updateInvoiceValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    //allow only SuperAdmin or eligible admin by _id
    if (req.auth.role !== 'SuperAdmin') {
      if (req.auth.id !== process.env.ELIGIBLE_ADMIN) {
        return res.status(403).json({ message: 'You are not authorized to update invoices.' });
      }
    }

    const invoice = await invoiceModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({
      message: 'Invoice updated successfully',
      invoice,
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};



export const updateInvoices = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const { id } = req.params;
    const updates = req.body;

    const invoice = await invoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Apply updates
    Object.assign(invoice, updates);
    const updatedInvoice = await invoice.save();

    res.status(200).json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};





// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await invoiceModel.find()
      .populate({ path: 'learner', select: '-password' })
      .populate({
        path: 'track',
        select: 'admin name price instructor duration image description createdAt updatedAt'
      })
      .lean();

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



//get single invoice
export const getSingleInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceModel.findById(id)
      .populate({ path: 'learner', select: '-password' })
      .populate({
        path: 'track',
        select: 'admin name price instructor duration image description createdAt updatedAt'
      })
      .lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({ success: true, invoice });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};


//update invoice
// export const updateInvoices = async (req, res) => {
//   try {
//     const { invoiceId } = req.params;

//     // Validate update fields
//     const { error, value } = updateInvoiceValidator.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     const invoice = await invoiceModel.findById(invoiceId);
//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Invoice not found',
//       });
//     }

//     //check learner exists and has dropped out as a learner
//     if (value.learner) {
//       const learner = await learnerModel.findById(value.learner);
//       if (!learner || learner.role !== 'Learner') {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid learner',
//         });
//       }
//     }

//     //update invoice
//     Object.assign(invoice, value);
//     await invoice.save();

//     //repopulate updated invoice
//     const newPopulatedInvoice = await invoiceModel.findById(invoiceId)
//       .populate({ path: 'learner', select: '-password' })
//       .populate({
//         path: 'track',
//         select: 'admin name price instructor duration image description createdAt updatedAt'
//       })
//       .lean();

//     return res.status(200).json({
//       success: true,
//       message: 'Invoice updated successfully',
//       invoice: newPopulatedInvoice,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

