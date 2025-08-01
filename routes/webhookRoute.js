import { Router } from 'express';
import { handlingPaystackWebhook } from '../controllers/webhookController.js';


const webhookRouter = Router();

//no auth middleware here. It is public so Paystack can send data to my db.
//webhook that happends in the background. Automatically after any payment, even if user closes browser.behind the scenes
webhookRouter.post("/invoices/paystack-webhook", handlingPaystackWebhook);

export default webhookRouter;
