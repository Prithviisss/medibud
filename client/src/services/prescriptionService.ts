import api from './api';

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  _id: string;
  userId: string;
  imageUrl?: string;
  ocrText?: string;
  medicines: PrescriptionMedicine[];
  diagnosis?: string;
  doctorName?: string;
  hospitalName?: string;
  date?: string;
  source: 'uploaded' | 'ai_generated';
  createdAt: string;
}

export const prescriptionService = {
  upload: async (file: File, onProgress?: (pct: number) => void): Promise<Prescription> => {
    const formData = new FormData();
    formData.append('prescriptionImage', file);

    const res = await api.post<Prescription>('/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return res.data;
  },

  getAll: async (): Promise<Prescription[]> => {
    const res = await api.get<Prescription[]>('/prescriptions');
    return res.data;
  },

  getById: async (id: string): Promise<Prescription> => {
    const res = await api.get<Prescription>(`/prescriptions/${id}`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/prescriptions/${id}`);
  },
};
