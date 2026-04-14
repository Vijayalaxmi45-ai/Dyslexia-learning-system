import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from './models/User.js';
import { Progress } from './models/Progress.js';
import { QuizScore } from './models/QuizScore.js';
import { AssessmentResult } from './models/AssessmentResult.js';
import { authRequired, loadUser, adminOnly } from './middleware/auth.js';
import { predictWithOptionalFlask } from './services/predictService.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND = process.env.FRONTEND_URL || '*';

if (!process.env.MONGODB_URI) {
  console.warn('⚠️ WARNING: MONGODB_URI is not set. Registration and login will fail.');
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not set. Authentication will fail.');
}

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: FRONTEND === '*' ? true : FRONTEND.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many registration attempts' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: 'Too many login attempts' },
});

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.post('/register', registerLimiter, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const role = adminEmail && email === adminEmail ? 'admin' : 'user';
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });
    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error('Registration Error:', e);
    return res.status(500).json({ error: `Registration failed: ${e.message}` });
  }
});

app.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/user-data', authRequired, loadUser, async (req, res) => {
  try {
    const [progress, quizScores, assessments] = await Promise.all([
      Progress.find({ userId: req.user._id }).lean(),
      QuizScore.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
      AssessmentResult.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);
    return res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        difficultyLevel: req.user.difficultyLevel,
        lastQuizAverage: req.user.lastQuizAverage,
      },
      progress,
      quizScores,
      assessments,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load user data' });
  }
});

app.post('/progress', authRequired, loadUser, async (req, res) => {
  try {
    const moduleId = String(req.body?.moduleId || '').trim();
    if (!moduleId) return res.status(400).json({ error: 'moduleId is required' });
    const percentComplete = Math.min(100, Math.max(0, Number(req.body?.percentComplete) || 0));
    const meta = req.body?.meta && typeof req.body.meta === 'object' ? req.body.meta : {};

    const doc = await Progress.findOneAndUpdate(
      { userId: req.user._id, moduleId },
      {
        $set: { percentComplete, meta: { ...meta, updatedAt: new Date().toISOString() } },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json(doc);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.get('/progress', authRequired, loadUser, async (req, res) => {
  try {
    const list = await Progress.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load progress' });
  }
});

app.post('/quiz-score', authRequired, loadUser, async (req, res) => {
  try {
    const quizId = String(req.body?.quizId || 'default');
    const score = Number(req.body?.score);
    const total = Number(req.body?.total);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'Valid score and total are required' });
    }
    const details = req.body?.details && typeof req.body.details === 'object' ? req.body.details : {};
    const row = await QuizScore.create({
      userId: req.user._id,
      quizId,
      score,
      total,
      details,
    });

    const recent = await QuizScore.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const avg = recent.reduce((s, q) => s + q.score / q.total, 0) / recent.length;
    let difficultyLevel = 'medium';
    if (avg >= 0.85) difficultyLevel = 'hard';
    else if (avg < 0.5) difficultyLevel = 'easy';
    await User.findByIdAndUpdate(req.user._id, {
      lastQuizAverage: Math.round(avg * 100) / 100,
      difficultyLevel,
    });

    return res.status(201).json({ quizScore: row, suggestedDifficulty: difficultyLevel });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save quiz score' });
  }
});

app.get('/quiz-scores', authRequired, loadUser, async (req, res) => {
  try {
    const list = await QuizScore.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load quiz scores' });
  }
});

app.post('/api/predict', async (req, res) => {
  try {
    const answers = req.body?.answers;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'answers array required' });
    }
    const result = await predictWithOptionalFlask(answers);

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token && process.env.JWT_SECRET) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.sub);
        if (user) {
          await AssessmentResult.create({
            userId: user._id,
            score: result.score,
            interpretation: result.analysis,
            prediction: result.prediction,
            details: { answers, source: result.source },
          });
        }
      } catch {
        /* anonymous assessment */
      }
    }

    return res.json({
      prediction: result.prediction,
      analysis: result.analysis,
      suggestions: result.suggestions,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Prediction failed' });
  }
});

app.get('/admin/users', authRequired, adminOnly, loadUser, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(
      users.map(async (u) => {
        const [pCount, qCount, aCount] = await Promise.all([
          Progress.countDocuments({ userId: u._id }),
          QuizScore.countDocuments({ userId: u._id }),
          AssessmentResult.countDocuments({ userId: u._id }),
        ]);
        return { ...u, counts: { progress: pCount, quizzes: qCount, assessments: aCount } };
      })
    );
    return res.json(enriched);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Admin list failed' });
  }
});

app.get('/admin/user/:id/progress', authRequired, adminOnly, async (req, res) => {
  try {
    const uid = req.params.id;
    const [progress, quizScores] = await Promise.all([
      Progress.find({ userId: uid }).lean(),
      QuizScore.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    return res.json({ progress, quizScores });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load user progress' });
  }
});

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
