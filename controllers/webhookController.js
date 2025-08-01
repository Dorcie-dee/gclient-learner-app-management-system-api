import crypto from 'crypto';
import { invoiceModel } from '../models/invoiceModel.js';
import { sendPaymentConfirmation } from '../utils/mailing.js';


export const handlingPaystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  //validate Paystack's signature from headers
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body;

  //process only successful payments
  if (event.event === 'charge.success') {

    try {
      //use learner email to find invoice, extracting from paystack
      const transactionRef = event.data.reference;
      const learnerEmail = event.data.customer.email;
      const paidAmount = event.data.amount / 100; //converts kobo to NGN/GHS
      const firstName = event.data.customer.first_name || 'Learner';

      if (!learnerEmail || !transactionRef) {
        return res.status(400).json({ message: 'Missing required data from Paystack webhook' });
      }

      //find invoice using reference. if it fails, then email
      const invoice = await invoiceModel.findOne({ reference: transactionRef },
        {
          email: learnerEmail,
        });

      if (!invoice) {
        return res.status(404).json({ message: 'Matching invoice not found' });
      }

      //idempotent check to not re-process if already paid using my verifyPayment endpoint
      if (invoice.status === 'paid') {
        return res.sendStatus(200);
      }

      //invoice update
      invoice.status = 'paid';
      invoice.paidAt = new Date().toISOString();
      invoice.transactionRef = transactionRef;
      await invoice.save();

      //email notification to the user
      const emailSubject = "Successful Payment Confirmation";
      const emailBody = sendPaymentConfirmation
        .replace('{{firstName}}', firstName)
        .replace('{{amount}}', paidAmount.toLocaleString())
        .replace('{{invoiceId}}', invoice._id.toString)

      await sendingEmail(learnerEmail.email, emailSubject, emailBody);

      return res.sendStatus(200);
    } catch (error) {
      return res.status(500).json({ 
        message: 'Webhook error', 
        error: error.message });
    }
  }

  return res.sendStatus(200);
};
