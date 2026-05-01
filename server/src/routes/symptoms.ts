import { Router, Response } from 'express';
import OpenAI from 'openai';
import { auth, AuthRequest } from '../middleware/auth';
import SymptomHistory from '../models/SymptomHistory';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are MediBud, a medical assistant AI. Based on the symptoms provided, give a structured response with: 1) Likely diagnosis (1-2 possibilities), 2) Suggested over-the-counter medicines with dosage, 3) Severity level (mild/moderate/severe), 4) Whether the patient should see a doctor urgently. Always end with: 'This is not a substitute for professional medical advice. Please consult a doctor for proper diagnosis.' Format your response as JSON with keys: diagnosis, medicines (array of {name, dosage, frequency, notes}), severity, seeDoctor (boolean), disclaimer.`;

// POST /api/symptoms/analyze
router.post('/analyze', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { symptoms, patientAge, patientGender } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one symptom' });
    }

    // Build user message
    let userMessage = `Symptoms: ${symptoms.join(', ')}`;
    if (patientAge) userMessage += `\nPatient Age: ${patientAge}`;
    if (patientGender) userMessage += `\nPatient Gender: ${patientGender}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const rawContent = completion.choices[0].message.content || '{}';
    const aiResponse = JSON.parse(rawContent) as {
      diagnosis: string;
      medicines: { name: string; dosage: string; frequency: string; notes: string }[];
      severity: 'mild' | 'moderate' | 'severe';
      seeDoctor: boolean;
      disclaimer: string;
    };

    // Save to SymptomHistory
    const history = new SymptomHistory({
      userId: req.user!.id,
      symptoms,
      aiResponse: rawContent,
      suggestedMedicines: (aiResponse.medicines || []).map((m) => ({
        name: m.name,
        dosage: m.dosage,
        notes: m.notes,
      })),
      severity: aiResponse.severity || 'mild',
    });
    await history.save();

    return res.json({
      ...aiResponse,
      historyId: history._id,
    });
  } catch (err: any) {
    console.error('Symptom analysis error:', err);
    return res.status(500).json({ message: err.message || 'Server error during analysis' });
  }
});

// GET /api/symptoms/history — fetch user's past symptom checks
router.get('/history', auth, async (req: AuthRequest, res: Response) => {
  try {
    const history = await SymptomHistory.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json(history);
  } catch (err) {
    console.error('Fetch history error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/symptoms/stats — get stats for dashboard
router.get('/stats', auth, async (req: AuthRequest, res: Response) => {
  try {
    const count = await SymptomHistory.countDocuments({ userId: req.user!.id });
    return res.json({ totalChecks: count });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
