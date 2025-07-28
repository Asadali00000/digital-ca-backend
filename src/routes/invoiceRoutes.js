import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createInvoice, deleteInvoice, getAllInvoice, getInvoiceById, updateInvoice } from '../controllers/invoiceController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { invoiceSchema } from '../validators/schemas.js';
const router = express.Router();

router.post('/createInvoice', protect , validateBody(invoiceSchema), createInvoice);
router.get('/getInvoice/:id', protect , getInvoiceById);
router.get('/getAllInvoices', protect , getAllInvoice);
router.patch('/updateInvoice/:id', protect , updateInvoice);
router.delete('/deleteInvoice/:id', protect , deleteInvoice);
export default router;
