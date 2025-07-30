//const invoices = await invoiceModel.find().populate('learner').populate('track');
import axios from "axios";
import { createInvoiceValidator } from "../validators/invoiceValidator.js";
import { learnerModel } from "../models/learnerModel.js";
import { trackModel } from "../models/trackModel.js";
import { invoiceModel } from "../models/invoiceModel.js";
import { generateInvoiceEmail, sendingEmail } from "../utils/mailing.js";



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

    const emailContent = generateInvoiceEmail({
      firstName: learner.firstName,
      amount,
      paymentLink: invoice.paymentLink,
      paymentDetails,
      dueDate: invoice.dueDate,
    });

    await sendingEmail({
      to: learner.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });


    const populatedInvoice = await invoice
      .populate('learner')
      .populate('track');

    // Respond
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully and email sent to learner',
      invoice: populatedInvoice,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};