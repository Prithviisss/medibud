import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Appointment from '../models/Appointment';

const router = Router();

// POST /api/appointments — book a new appointment
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { hospitalName, doctorName, date, time, notes } = req.body;

    if (!hospitalName || !date || !time) {
      return res.status(400).json({ error: 'Hospital name, date, and time are required' });
    }

    const appointment = new Appointment({
      userId: req.user!.id,
      hospitalName,
      doctorName: doctorName || undefined,
      date: new Date(date),
      time,
      notes: notes || undefined,
      status: 'pending',
    });

    await appointment.save();

    return res.status(201).json(appointment);
  } catch (err: any) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create appointment' });
  }
});

// GET /api/appointments — list all appointments for the user, sorted by date
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const appointments = await Appointment.find({ userId: req.user!.id })
      .sort({ date: 1 });
    return res.json(appointments);
  } catch (err: any) {
    console.error('Fetch appointments error:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// DELETE /api/appointments/:id — cancel an appointment
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.userId.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Appointment cancelled successfully' });
  } catch (err: any) {
    console.error('Delete appointment error:', err);
    return res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;
