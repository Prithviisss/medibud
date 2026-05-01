import api from './api';

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  notes: string;
}

export interface SymptomAnalysisResult {
  diagnosis: string;
  medicines: Medicine[];
  severity: 'mild' | 'moderate' | 'severe';
  seeDoctor: boolean;
  disclaimer: string;
  historyId?: string;
}

export interface AnalyzePayload {
  symptoms: string[];
  patientAge?: number;
  patientGender?: string;
}

export const symptomService = {
  analyze: async (payload: AnalyzePayload): Promise<SymptomAnalysisResult> => {
    const res = await api.post<SymptomAnalysisResult>('/symptoms/analyze', payload);
    return res.data;
  },

  getHistory: async () => {
    const res = await api.get('/symptoms/history');
    return res.data;
  },

  getStats: async (): Promise<{ totalChecks: number }> => {
    const res = await api.get('/symptoms/stats');
    return res.data;
  },
};
