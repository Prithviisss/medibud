import mongoose, { Schema, Document } from 'mongoose';

export interface ISuggestedMedicine {
  name: string;
  dosage: string;
  notes: string;
}

export interface ISymptomHistory extends Document {
  userId: mongoose.Types.ObjectId;
  symptoms: string[];
  aiResponse?: string;
  suggestedMedicines: ISuggestedMedicine[];
  severity: 'mild' | 'moderate' | 'severe';
  createdAt: Date;
}

const suggestedMedicineSchema = new Schema<ISuggestedMedicine>(
  {
    name: { type: String },
    dosage: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const symptomHistorySchema = new Schema<ISymptomHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: { type: [String], default: [] },
  aiResponse: { type: String },
  suggestedMedicines: { type: [suggestedMedicineSchema], default: [] },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISymptomHistory>('SymptomHistory', symptomHistorySchema);
