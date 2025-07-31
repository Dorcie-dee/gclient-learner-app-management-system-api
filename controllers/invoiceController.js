//const invoices = await invoiceModel.find().populate('learner').populate('track');
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

    // Step 1: Initialize Paystack Transaction
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

    const paymentLink = response.data.data.authorization_url;

    // Step 2: Create Invoice in DB
    const invoice = await invoiceModel.create({
      learner,
      track: relatedTrack._id,
      amount: invoiceAmount,
      dueDate: invoiceDueDate,
      paystackCallbackUrl,
      paymentLink,
      paymentDetails,
    });


    const emailSubject = "Your Invoice is Ready - Complete Your Payment";
    const emailBody = generateInvoiceEmailTemplate
      .replace('{{firstName}}', existingLearner.firstName)
      .replace('{{amount}}', invoiceAmount)
      .replace('{{paymentLink}}', invoice.paymentLink)
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


//update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Validate update fields
    const { error, value } = updateInvoiceValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const invoice = await invoiceModel.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    //check learner exists and has dropped out as a learner
    if (value.learner) {
      const learner = await learnerModel.findById(value.learner);
      if (!learner || learner.role !== 'Learner') {
        return res.status(400).json({
          success: false,
          message: 'Invalid learner',
        });
      }
    }

    //update invoice
    Object.assign(invoice, value);
    await invoice.save();

    //repopulate updated invoice
    const newPopulatedInvoice = await invoiceModel.findById(invoiceId)
      .populate({ path: 'learner', select: '-password' })
      .populate({
        path: 'track',
        select: 'admin name price instructor duration image description createdAt updatedAt'
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: newPopulatedInvoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};



export const updateInvoices = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    const adminUser = req.auth;

    const invoice = await invoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const changedFields = [];

    //track changes that require re-sending email
    const fieldsToCheck = ['amount', 'dueDate', 'status'];

    fieldsToCheck.forEach(field => {
      if (updateFields[field] && updateFields[field] !== invoice[field]) {
        changedFields.push(field);
      }
    });

    // Apply the updates
    Object.keys(updateFields).forEach(key => {
      invoice[key] = updateFields[key];
    });

    // Audit tracking
    invoice.updatedBy = adminUser._id;
    invoice.updatedAt = new Date();

    // Optional: Push to update history array
    invoice.updateHistory = invoice.updateHistory || [];
    invoice.updateHistory.push({
      updatedBy: adminUser._id,
      updatedAt: new Date(),
      changedFields,
    });

    await invoice.save();

    // Conditionally re-send invoice email
    if (changedFields.length > 0) {
      const learner = await User.findById(invoice.user); // or invoice.learnerId
      await sendInvoiceEmail(learner.email, {
        invoice,
        subject: 'Updated Invoice Notice',
        note: `The following fields were updated: ${changedFields.join(', ')}`,
      });

      // Log the email activity
      console.log(`Invoice update email sent to ${learner.email} at ${new Date().toISOString()} | Changed: ${changedFields.join(', ')}`);
    }

    res.status(200).json({ message: 'Invoice updated successfully', changedFields });
  } catch (error) {
    console.error('Invoice update error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
