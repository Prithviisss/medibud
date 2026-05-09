import api from './api';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export const emergencyService = {
  getContacts: async (): Promise<{ emergencyContacts: EmergencyContact[]; userName: string }> => {
    const res = await api.get('/emergency/contacts');
    return res.data;
  },

  updateContacts: async (emergencyContacts: EmergencyContact[]) => {
    const res = await api.put('/emergency/contacts', { emergencyContacts });
    return res.data;
  },

  sendSOS: async (latitude?: number, longitude?: number) => {
    const res = await api.post('/emergency/sos', { latitude, longitude });
    return res.data as { success: boolean; contactsNotified: number; totalContacts: number; errors?: string[] };
  },
};
