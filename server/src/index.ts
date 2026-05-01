import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import symptomRoutes from './routes/symptoms';

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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';

if (MONGODB_URI) {
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
