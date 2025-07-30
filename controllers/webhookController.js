import crypto from 'crypto';
import { invoiceModel } from '../models/invoiceModel.js';


export const handlePaystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  // Get Paystack's signature from headers
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body;

  // Handle only successful payments
  if (event.event === 'charge.success') {
    const reference = event.data.reference;

    try {
      const invoice = await invoiceModel.findOne({ reference });

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Avoid re-processing
      if (invoice.status !== 'paid') {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        await invoice.save();

        //future email notification to the user will come here
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(200).json({ received: true });
};
