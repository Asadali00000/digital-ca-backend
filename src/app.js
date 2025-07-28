import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import  errorHandler  from './middleware/errorHandler.js';
const app=express()
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true

}))

app.use(bodyParser.json());
app.use('/api/auth',authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/compliance', complianceRoutes);
app.use(errorHandler)

app.use((req, res) => {
  res.status(404).json({
		success: false,
    message: 'Route not found'
  });
});

// app.use(errorHandler);
export default app;
