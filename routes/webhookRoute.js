import { Router } from 'express';
import { handlePaystackWebhook} from '../controllers/webhookController.js';
import { verifyPaystackSignature } from '../middlewares/paystackSig.js';


const webhookRouter = Router();

//no auth middleware here. It is public so Paystack can send data to my db.
//webhook that happends in the background. Automatically after any payment, even if user closes browser.behind the scenes
// webhookRouter.post("paystack/webhook", verifyPaystackSignature, handlingPaystackWebhook);
webhookRouter.post("paystack/webhook", verifyPaystackSignature, handlePaystackWebhook);

export default webhookRouter;
