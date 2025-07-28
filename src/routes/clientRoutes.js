import express from 'express';
import {createClient, updateClient , deleteClient, restoreClient, getClient } from '../controllers/clientController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { clientSchema } from '../validators/schemas.js';
const router = express.Router();
router.post('/createClient', protect , validateBody(clientSchema), createClient);
router.put('/updateClient/:id', protect ,updateClient);
router.delete('/delete/:id', protect ,deleteClient);
router.post('/restore/:id', protect ,restoreClient);
router.get('/getClients', protect ,getClient);

export default router;
