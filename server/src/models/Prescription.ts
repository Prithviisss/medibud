import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface IPrescription extends Document {
  userId: mongoose.Types.ObjectId;
  imageUrl?: string;
  ocrText?: string;
  medicines: IMedicine[];
  diagnosis?: string;
  doctorName?: string;
  hospitalName?: string;
  date?: Date;
  source: 'uploaded' | 'ai_generated';
  createdAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
  },
  { _id: false }
);

const prescriptionSchema = new Schema<IPrescription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String },
  ocrText: { type: String },
  medicines: { type: [medicineSchema], default: [] },
  diagnosis: { type: String },
  doctorName: { type: String },
  hospitalName: { type: String },
  date: { type: Date },
  source: { type: String, enum: ['uploaded', 'ai_generated'] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPrescription>('Prescription', prescriptionSchema);
