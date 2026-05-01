import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  userId: mongoose.Types.ObjectId;
  hospitalName?: string;
  doctorName?: string;
  date?: Date;
  time?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalName: { type: String },
  doctorName: { type: String },
  date: { type: Date },
  time: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
