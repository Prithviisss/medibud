import api from './api';

export interface Appointment {
  _id: string;
  userId: string;
  hospitalName: string;
  doctorName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export const appointmentService = {
  create: async (data: {
    hospitalName: string;
    doctorName?: string;
    date: string;
    time: string;
    notes?: string;
  }): Promise<Appointment> => {
    const res = await api.post<Appointment>('/appointments', data);
    return res.data;
  },

  getAll: async (): Promise<Appointment[]> => {
    const res = await api.get<Appointment[]>('/appointments');
    return res.data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },
};
