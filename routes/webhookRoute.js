import { Router } from 'express';
import { handlePaystackWebhook } from '../controllers/webhookController.js';


const webhookRouter = Router();

//no auth middleware here. It is public so Paystack can send data to my db.
webhookRouter.post('/paystack', handlePaystackWebhook);

export default webhookRouter;
