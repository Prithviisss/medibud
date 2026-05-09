import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// Lazy Twilio client — only created when first SOS is triggered
let twilioClient: any = null;
function getTwilio() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token || sid.startsWith('your_')) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    }
    const twilio = require('twilio');
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

// POST /api/emergency/sos — send SOS to all emergency contacts
router.post('/sos', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    const user = await User.findById(req.user!.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      return res.status(400).json({ error: 'No emergency contacts configured. Please add contacts first.' });
    }

    const locationStr = latitude && longitude
      ? `Their last known location: https://maps.google.com/?q=${latitude},${longitude}`
      : 'Location could not be determined';

    const message = `EMERGENCY ALERT from MediBud: ${user.name} has triggered an SOS alert. ${locationStr} — Please contact them or call emergency services immediately.`;

    let contactsNotified = 0;
    const errors: string[] = [];

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      return res.status(500).json({ error: 'TWILIO_PHONE_NUMBER not configured in environment' });
    }

    const client = getTwilio();

    for (const contact of user.emergencyContacts) {
      try {
        await client.messages.create({
          body: message,
          from: fromNumber,
          to: contact.phone,
        });
        contactsNotified++;
      } catch (err: any) {
        console.error(`Failed to send SMS to ${contact.name} (${contact.phone}):`, err.message);
        errors.push(`Failed to notify ${contact.name}`);
      }
    }

    return res.json({
      success: true,
      contactsNotified,
      totalContacts: user.emergencyContacts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('SOS error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send SOS alert' });
  }
});

// PUT /api/emergency/contacts — update emergency contacts (max 3)
router.put('/contacts', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { emergencyContacts } = req.body;

    if (!Array.isArray(emergencyContacts)) {
      return res.status(400).json({ error: 'emergencyContacts must be an array' });
    }

    if (emergencyContacts.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 emergency contacts allowed' });
    }

    // Validate each contact
    for (const c of emergencyContacts) {
      if (!c.name || !c.phone || !c.relation) {
        return res.status(400).json({ error: 'Each contact must have name, phone, and relation' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { emergencyContacts },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (err: any) {
    console.error('Update contacts error:', err);
    return res.status(500).json({ error: 'Failed to update emergency contacts' });
  }
});

// GET /api/emergency/contacts — get user's emergency contacts
router.get('/contacts', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('emergencyContacts name');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ emergencyContacts: user.emergencyContacts, userName: user.name });
  } catch (err: any) {
    console.error('Get contacts error:', err);
    return res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

export default router;
