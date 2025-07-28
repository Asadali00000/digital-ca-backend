import express from 'express';
import {register , login} from '../controllers/authControllers.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

export default router;
