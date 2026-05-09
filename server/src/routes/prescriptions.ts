import { Router, Response } from 'express';
import multer from 'multer';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cloudinary = require('cloudinary').v2;
import { GoogleGenAI } from '@google/genai';
import { auth, AuthRequest } from '../middleware/auth';
import Prescription from '../models/Prescription';

const router = Router();

// ────────────────────────────────────────────
// Cloudinary config (lazy — reads env at first use)
// ────────────────────────────────────────────
let cloudinaryConfigured = false;
function ensureCloudinary() {
  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
  }
}

// ────────────────────────────────────────────
// Gemini AI client (lazy)
// ────────────────────────────────────────────
let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.startsWith('your_gemini')) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

// ────────────────────────────────────────────
// Multer: memory storage, accept jpg/jpeg/png/pdf, max 5 MB
// ────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and PDF files are allowed'));
    }
  },
});

// ────────────────────────────────────────────
// Helper: upload buffer to Cloudinary
// ────────────────────────────────────────────
function uploadToCloudinary(buffer: Buffer, mimetype: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ensureCloudinary();
    const resourceType = mimetype === 'application/pdf' ? 'raw' as const : 'image' as const;
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'medibud/prescriptions', resource_type: resourceType },
      (err: any, result: any) => {
        if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ────────────────────────────────────────────
// Helper: OCR + Parse with Gemini Vision (single call)
// Sends the image directly to Gemini which reads and parses it
// ────────────────────────────────────────────
interface ParsedPrescription {
  ocrText: string;
  doctorName: string | null;
  hospitalName: string | null;
  date: string | null;
  diagnosis: string | null;
  medicines: Array<{
    name: string | null;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
  }>;
}

async function analyzeWithGemini(imageBuffer: Buffer, mimeType: string): Promise<ParsedPrescription> {
  const ai = getAI();

  const base64 = imageBuffer.toString('base64');

  const prompt = `You are analyzing a medical prescription image. Do the following:
1. First, extract ALL the raw text visible in the image (OCR).
2. Then, parse the prescription details from that text.

Return a JSON object with these fields:
- ocrText: the full raw text extracted from the image
- doctorName: the prescribing doctor's name (or null)
- hospitalName: the hospital or clinic name (or null)
- date: the prescription date in YYYY-MM-DD format (or null)
- diagnosis: the diagnosis or condition (or null)
- medicines: array of objects, each with {name, dosage, frequency, duration} (use null for unclear fields)

Return ONLY valid JSON, no other text.`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: mimeType, data: base64 } },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const raw = response.text || '{}';
      return JSON.parse(raw) as ParsedPrescription;
    } catch (err: any) {
      console.error(`Model ${model} failed:`, err.message || err);
      // If it's a 503 (overloaded), try the next model
      if (err.status === 503 || err.message?.includes('503')) continue;
      // For other errors, throw immediately
      throw err;
    }
  }

  throw new Error('All Gemini models are currently unavailable. Please try again in a minute.');
}

// ══════════════════════════════════════════════
// POST /api/prescriptions/upload  (protected)
// ══════════════════════════════════════════════
router.post(
  '/upload',
  auth,
  upload.single('prescriptionImage'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // 1. Upload to Cloudinary
      let imageUrl = '';
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        // Continue without image URL — OCR can still work
      }

      // 2. Analyze with Gemini Vision (OCR + Parse in one call)
      let parsed: ParsedPrescription;
      try {
        parsed = await analyzeWithGemini(req.file.buffer, req.file.mimetype);
      } catch (err: any) {
        console.error('Gemini analysis error:', err);
        return res.status(500).json({ message: 'Analysis failed: ' + (err.message || 'Unknown error') });
      }

      // 3. Save to DB
      const prescription = new Prescription({
        userId: req.user!.id,
        imageUrl,
        ocrText: parsed.ocrText || '',
        doctorName: parsed.doctorName || undefined,
        hospitalName: parsed.hospitalName || undefined,
        date: parsed.date ? new Date(parsed.date) : undefined,
        diagnosis: parsed.diagnosis || undefined,
        medicines: (parsed.medicines || []).map((m) => ({
          name: m.name || 'Unknown',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          duration: m.duration || '',
        })),
        source: 'uploaded',
      });

      await prescription.save();

      return res.status(201).json(prescription);
    } catch (err: any) {
      console.error('Prescription upload error:', err);
      return res.status(500).json({ message: err.message || 'Server error during upload' });
    }
  }
);

// ══════════════════════════════════════════════
// GET /api/prescriptions  (protected)
// ══════════════════════════════════════════════
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    return res.json(prescriptions);
  } catch (err) {
    console.error('Fetch prescriptions error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ══════════════════════════════════════════════
// GET /api/prescriptions/:id  (protected)
// ══════════════════════════════════════════════
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    if (prescription.userId.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    return res.json(prescription);
  } catch (err) {
    console.error('Fetch prescription error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ══════════════════════════════════════════════
// DELETE /api/prescriptions/:id  (protected)
// ══════════════════════════════════════════════
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    if (prescription.userId.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Prescription.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Prescription deleted' });
  } catch (err) {
    console.error('Delete prescription error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
