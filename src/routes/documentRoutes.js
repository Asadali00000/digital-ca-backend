import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { deleteDocument, getAllDocuments, getDocumentsByClient, updateDocument, uploadDocument } from '../controllers/documentController.js';
import { upload}  from '../middleware/uploadMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { documentSchema } from '../validators/schemas.js';
const router = express.Router();

router.post('/upload', protect , upload.array('documents', 10), validateBody(documentSchema), uploadDocument);
router.get('/getDocument/:id', protect ,getDocumentsByClient);
router.get('/getAllDocuments', protect ,getAllDocuments);
router.patch('/updateDocument/:id', protect ,updateDocument);
router.delete('/deleteDocument/:id', protect ,deleteDocument);

export default router;
