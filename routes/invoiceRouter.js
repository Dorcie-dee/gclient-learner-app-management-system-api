import { Router } from "express";
import { createInvoice, getAllInvoices, getSingleInvoice, updateInvoice, verifyPayment } from "../controllers/invoiceController.js";
import { isAuthenticated, isAuthorized} from "../middlewares/authMiddleware.js";


const invoiceRouter = Router();


invoiceRouter.post('/invoices', isAuthenticated, createInvoice);

//redirection after paystack payment initiation process. To verify a transaction while user is online.	
invoiceRouter.get("/invoices/verify-payment", isAuthenticated, verifyPayment);  

//get all invoices by admin and superadmin
invoiceRouter.get("/invoices", isAuthenticated, isAuthorized(['Admin', 'SuperAdmin']), getAllInvoices); 

//get one invoice
invoiceRouter.get("/invoices/:id", isAuthenticated, isAuthorized(['Admin', 'SuperAdmin']), getSingleInvoice);  

//update invoice
invoiceRouter.put("/invoices/:id", isAuthenticated, updateInvoice);  



export default invoiceRouter;