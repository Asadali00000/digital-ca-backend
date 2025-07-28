import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createAlert, deleteAlert, getAllAlerts, updateAlert } from '../controllers/alertController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { alertSchema } from '../validators/schemas.js';
const router = express.Router();

router.post('/create', protect , validateBody(alertSchema), createAlert);
router.patch('/update/:id', protect ,updateAlert);
router.patch('/delete/:id', protect ,deleteAlert);
router.get('/getAlerts', protect ,getAllAlerts);

export default router;
