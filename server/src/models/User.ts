import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bloodGroup?: string;
  dateOfBirth?: Date;
  emergencyContacts: IEmergencyContact[];
  address?: string;
  createdAt: Date;
}

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String },
    phone: { type: String },
    relation: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  bloodGroup: { type: String },
  dateOfBirth: { type: Date },
  emergencyContacts: { type: [emergencyContactSchema], default: [] },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', userSchema);
