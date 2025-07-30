import { Router } from "express";
import { createInvoice } from "../controllers/invoiceController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";


const invoiceRouter = Router();


invoiceRouter.post('/invoices', isAuthenticated, createInvoice);


export default invoiceRouter;