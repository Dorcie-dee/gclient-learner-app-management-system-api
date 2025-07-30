import { Router } from "express";
import { createInvoice } from "../controllers/invoiceController.js";


const invoiceRouter = Router();


invoiceRouter.post('/invoices', createInvoice);


export default invoiceRouter;