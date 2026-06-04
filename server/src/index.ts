import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import symptomRoutes from './routes/symptoms';
import prescriptionRoutes from './routes/prescriptions';
import appointmentRoutes from './routes/appointments';
import emergencyRoutes from './routes/emergency';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/emergency', emergencyRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';

if (MONGODB_URI) {
  mongoose.set('debug', true);
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI not set — skipping database connection');
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
