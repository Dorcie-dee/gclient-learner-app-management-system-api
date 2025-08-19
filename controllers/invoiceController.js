import axios from "axios";
import { createInvoiceValidator, updateInvoiceValidator } from "../validators/invoiceValidator.js";
import { learnerModel } from "../models/learnerModel.js";
import { trackModel } from "../models/trackModel.js";
import { invoiceModel } from "../models/invoiceModel.js";
import { generateInvoiceEmailTemplate, sendingEmail, sendPaymentConfirmation } from "../utils/mailing.js";



export const createInvoice = async (req, res) => {
  try {
    const { error, value } = createInvoiceValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const { learner, track, paystackCallbackUrl, dueDate, paymentDetails } = value;
    // const { learner, track, paystackCallbackUrl, amount, dueDate, paymentDetails } = value;

    //get learner
    const existingLearner = await learnerModel.findById(learner);
    if (!existingLearner || existingLearner.role !== 'Learner') {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    //get track
    const relatedTrack = await trackModel.findById(track);
    if (!relatedTrack) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or non-existing track selected'
      });
    }

    // Auto-calculate invoice amount based on learner's paymentType
    let invoiceAmount = relatedTrack.price;

    if (existingLearner.paymentType === 'part') {
      invoiceAmount = relatedTrack.price / 2;
    }

    // const invoiceAmount = amount || relatedTrack.price;


    const invoiceDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // defaults to 7 days later

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


    //update Learner with track and status
    //await learnerModel.findByIdAndUpdate(
    //learner,
    //{
    //$set: {
    //  track: relatedTrack._id,
    //  status: 'paid'
    //}
    //}
    // );


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

    //finding invoice in DB
    const invoice = await invoiceModel.findOne(
      { reference: paymentData.reference })
      .populate("Learner");

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    //idempotent check: If already marked as paid, don't update again
    if (invoice.status === 'paid') {
      return res.status(200).json({
        message: 'Already verified as paid',
        invoice
      });
    }

    //update invoice only if it's not yet paid
    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.paymentDetails = JSON.stringify(paymentData);
    await invoice.save();


    //prepare email content
    const emailSubject = "✅ Payment Received - Invoice Confirmation";
    const invoiceAmount = paymentData.amount / 100; //paystack gives kobo
    const emailBody = sendPaymentConfirmation
      .replace("{{firstName}}", invoice.learner.firstName)
      .replace("{{amount}}", invoiceAmount)
      .replace("{{invoiceId}}", invoice._id);

    try {
      //send email
      await sendingEmail(invoice.learner.email, emailSubject, emailBody);
    } catch (paymentEmailError) {
      // rollback if email fails
      await invoiceModel.findByIdAndDelete(invoice._id);
      return res.status(500).json({
        success: false,
        message: "Invoice was created but failed to send email.",
        error: paymentEmailError.message,
      });
    }


    return res.status(200).json({
      message: 'Payment verified and email sent successfully',
      invoice
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};



//superadmin and only eligible admin can update invoice
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












export const createAnInvoice = async (req, res) => {
  try {
    const { error, value } = createInvoiceValidator.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const {
      learner,                // ObjectId
      track,                  // ObjectId
      paymentType,            // "half" | "full" 
      paystackCallbackUrl,
      dueDate,
      paymentDetails
    } = value;

    // 1) Validate learner & track
    const existingLearner = await learnerModel.findById(learner);

    if (!existingLearner || existingLearner.role !== "Learner") {
      return res.status(404).json({
        success: false,
        message: "Learner not found"
      });
    }

    const relatedTrack = await trackModel.findById(track);
    if (!relatedTrack) {
      return res.status(400).json({
        success: false,
        message: "Invalid or non-existing track selected"
      });
    }

    const fullPrice = relatedTrack.price;

    //compute how much has already been PAID for this learner + track
    const paidInvoicesForTrack = await invoiceModel.find({
      learner,
      track,
      status: "paid",
    }).select("amount");

    const alreadyPaidForThisTrack = paidInvoicesForTrack.reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = Math.max(fullPrice - alreadyPaidForThisTrack, 0);

    //blocking overpayment if fully paid already
    if (outstanding <= 0) {
      return res.status(400).json({
        success: false,
        message: "Already enrolled in this track. Full payment completed.",
      });
    }

    //enforcing enrollment of at most 2 tracks  (count distinct tracks with any PAID amount)
    const paidInvoicesAllTracks = await invoiceModel.aggregate([

      {
        $match: {
          learner: existingLearner._id,
          status: "paid"
        }
      },

      {
        $group: {
          _id: "$track",
          totalPaid: { $sum: "$amount" }
        }
      },
    ]);

    const fullyOrPartiallyPaidTracks = paidInvoicesAllTracks
      .filter(t => t.totalPaid > 0)
      .map(t => String(t._id));

    const isNewTrack = !fullyOrPartiallyPaidTracks.includes(String(track));
    if (isNewTrack && fullyOrPartiallyPaidTracks.length >= 2) {
      return res.status(400).json({
        success: false,
        message: "Track enrollment limit reached (max 2 tracks).",
      });
    }

    //    - If no prior payment → allow "full" (fullPrice) or "half" (fullPrice/2)
    //    - If half already paid → only bill the remaining half (outstanding)
    let amountToBillNow;

    if (alreadyPaidForThisTrack === 0) {
      if (paymentType === "full") {
        amountToBillNow = fullPrice;
      } else if (paymentType === "half") {
        amountToBillNow = Math.ceil(fullPrice / 2);
      } else {
        return res.status(400).json({
          success: false,
          message: "payment must either be 'half' or 'full'"
        });
      }

      //never exceed outstanding track price
      amountToBillNow = Math.min(amountToBillNow, outstanding);
    } else if (alreadyPaidForThisTrack === Math.ceil(fullPrice / 2)) {

      //if learner already paid half; only allow the remaining half
      amountToBillNow = outstanding; //should be the exact remaining half
    } else {
      // just charge the outstanding (not exceeding full track price)
      amountToBillNow = outstanding;
    }

    //due date (defaults to 7 days)
    const invoiceDueDate =
      dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    //initialising Paystack for the amountToBillNow (in kobo)
    const initResp = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: existingLearner.email,
        amount: amountToBillNow * 100, // kobo
        callback_url: paystackCallbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentLink = initResp.data?.data?.authorization_url;
    const paystackReference = initResp.data?.data?.reference;

    const invoice = await invoiceModel.create({
      learner,
      track: relatedTrack._id,
      amount: amountToBillNow,     //amount to be paid in THIS step
      status: "pending",           //stays pending until verifyPayment endpoint
      paymentType: (alreadyPaidForThisTrack === 0 ? paymentType : "half"), //second step will always be the remaining half
      dueDate: invoiceDueDate,
      paystackCallbackUrl,
      paymentLink,
      reference: paystackReference,
      paymentDetails,
    });


    //sending email with payment link
    const emailSubject = "Your Invoice is Ready - Complete Your Payment";
    const emailBody = generateInvoiceEmailTemplate
      .replace("{{firstName}}", existingLearner.firstName)
      .replace("{{amount}}", amountToBillNow)
      .replace(/{{paymentLink}}/g, paymentLink)
      .replace("{{paymentDetails}}", paymentDetails || "")
      .replace("{{dueDate}}", invoiceDueDate.toLocaleDateString());

    try {
      await sendingEmail(existingLearner.email, emailSubject, emailBody);
    } catch (invoiceEmailError) {

      await invoiceModel.findByIdAndDelete(invoice._id);
      return res.status(500).json({
        success: false,
        message:
          "Invoice was created but failed to send email. The invoice has been removed. Please try again.",
        error: invoiceEmailError.message,
      });
    }

    //return populated invoice
    const populatedInvoice = await invoiceModel.findById(invoice._id)
      .populate({ path: "learner", select: "-password" })
      .populate({
        path: "track",
        select:
          "admin name price instructor duration image description createdAt updatedAt",
      })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully and email sent to learner",
      invoice: populatedInvoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};






export const verifyThePayment = async (req, res) => {
  const { reference } = req.query;

  try {
    // 1. Verify transaction with Paystack
    const { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paymentData = data.data;

    if (paymentData.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // 2. Find invoice
    const invoice = await invoiceModel.findOne({ reference: paymentData.reference }).populate("learner");

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // 3. Idempotency check: already fully paid
    if (invoice.status === 'paid') {
      return res.status(200).json({
        message: 'Already verified as paid',
        invoice
      });
    }

    // 4. Payment amount (Paystack returns kobo)
    const paystackAmount = paymentData.amount / 100;

    // 5. Handle payment types
    if (invoice.paymentType === "full") {
      invoice.amountPaid = invoice.amount; // instantly mark full
      invoice.status = "paid";
      invoice.paidAt = new Date();
    } 
    else if (invoice.paymentType === "half") {
      // Add partial payment
      invoice.amountPaid += paystackAmount;

      // If paid fully now, mark as "paid"
      if (invoice.amountPaid >= invoice.amount) {
        invoice.status = "paid";
        invoice.paidAt = new Date();
      } else {
        invoice.status = "partial";
      }
    }

    // 6. Store payment details
    invoice.paymentDetails = JSON.stringify(paymentData);
    await invoice.save();

    // 7. Prepare confirmation email
    const emailSubject = "✅ Payment Received - Invoice Confirmation";
    const emailBody = sendPaymentConfirmation
      .replace("{{firstName}}", invoice.learner.firstName)
      .replace("{{amount}}", paystackAmount)
      .replace("{{invoiceId}}", invoice._id);

    try {
      await sendingEmail(invoice.learner.email, emailSubject, emailBody);
    } catch (paymentEmailError) {
      // rollback if email fails
      await invoiceModel.findByIdAndDelete(invoice._id);
      return res.status(500).json({
        success: false,
        message: "Invoice was created but failed to send email.",
        error: paymentEmailError.message,
      });
    }

    return res.status(200).json({
      message: 'Payment verified and email sent successfully',
      invoice
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};







// export const updateInvoices = async (req, res) => {
//   try {
//     if (!req.auth || !req.auth.id) {
//       return res.status(401).json({ message: "Unauthorized access" });
//     }

//     const { id } = req.params;
//     const updates = req.body;

//     const invoice = await invoiceModel.findById(id);
//     if (!invoice) {
//       return res.status(404).json({ message: 'Invoice not found' });
//     }

//     // Apply updates
//     Object.assign(invoice, updates);
//     const updatedInvoice = await invoice.save();

//     res.status(200).json({
//       message: 'Invoice updated successfully',
//       invoice: updatedInvoice,
//     });
//   } catch (error) {
//     console.error('Update invoice error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };