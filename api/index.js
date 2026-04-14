import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from './server-src/models/User.js';
import { Progress } from './server-src/models/Progress.js';
import { QuizScore } from './server-src/models/QuizScore.js';
import { AssessmentResult } from './server-src/models/AssessmentResult.js';
import { authRequired, loadUser, adminOnly } from './server-src/middleware/auth.js';
import { predictWithOptionalFlask } from './server-src/services/predictService.js';

const app = express();
const FRONTEND = process.env.FRONTEND_URL || '*';

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: FRONTEND === '*' ? true : FRONTEND.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Helper to sign JWT
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    
    // Connect to DB if not connected (for Vercel serverless)
    if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI);

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'user' });
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user);
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/user-data', authRequired, loadUser, async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI);
      const [progress, quizScores, assessments] = await Promise.all([
        Progress.find({ userId: req.user._id }).lean(),
        QuizScore.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
        AssessmentResult.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30).lean(),
      ]);
      return res.json({ user: req.user, progress, quizScores, assessments });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
});

// For prediction, Node can call the Python serverless function
app.post('/api/predict-proxy', async (req, res) => {
    try {
        const { answers } = req.body;
        // In Vercel, we can call our other serverless function or logic
        const result = await predictWithOptionalFlask(answers); 
        return res.json(result);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

export default app;
