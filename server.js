// ==========================================
// PROOF OF MIND (POM) - SECURE BACKEND API ENGINE
// ==========================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-telegram-init-data']
}));

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is missing!");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error("MongoDB Connection Error:", err));
}

// --- डेटाबेस स्कीमा ---
const userSchema = new mongoose.Schema({
  telegram_id: { type: String, required: true, unique: true },
  username: { type: String, default: "" },
  first_name: { type: String, default: "" },
  balance: { type: Number, default: 130 },
  mineLevel: { type: Number, default: 1 },
  quizLevel: { type: Number, default: 1 },
  energy: { type: Number, default: 5 },
  isVerified: { type: Boolean, default: false },
  tonAddress: { type: String, default: null },
  referrer_id: { type: String, default: null },
  unclaimedCommission: { type: Number, default: 0 },
  completedTasks: [{ type: String }],
  referrals: {
    tier1: [{ type: String }],
    tier2: [{ type: String }],
    tier3: [{ type: String }]
  },
  lastMineTimestamp: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const questionSchema = new mongoose.Schema({
  id: { type: Number },
  question: { type: String },
  options: [{ type: String }],
  answer: { type: String },
  question_hi: { type: String },
  question_en: { type: String },
  options_hi: [{ type: String }],
  options_en: [{ type: String }],
  correctIndex: { type: Number },
  reward: { type: Number, default: 10 }
}, { strict: false });

const Question = mongoose.model('Question', questionSchema, 'questions');

const puzzleSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  word_hi: { type: String, required: true },
  word_en: { type: String, required: true },
  reward: { type: Number, default: 3 }
});

const PuzzleWord = mongoose.model('PuzzleWord', puzzleSchema, 'puzzle_words');

// विभिन्न लंबाई वाले डाइवर्स पज़ल शब्द (ताकि लेवल बढ़ने पर शब्द और बॉक्स दोनों बदलें)
const DIVERSE_PUZZLE_WORDS = [
  { level: 1, word_hi: "मन", word_en: "MIND", reward: 3 },
  { level: 2, word_hi: "ज्ञान", word_en: "KNOW", reward: 3 },
  { level: 3, word_hi: "सोच", word_en: "THINK", reward: 4 },
  { level: 4, word_hi: "बुद्धि", word_en: "SMART", reward: 4 },
  { level: 5, word_hi: "चेतना", word_en: "BRAIN", reward: 5 },
  { level: 6, word_hi: "सत्यता", word_en: "TRUTH", reward: 5 },
  { level: 7, word_hi: "मस्तिष्क", word_en: "LOGIC", reward: 6 },
  { level: 8, word_hi: "नेटवर्क", word_en: "NETWORK", reward: 6 },
  { level: 9, word_hi: "ब्लॉकचेन", word_en: "BLOCKCHAIN", reward: 7 },
  { level: 10, word_hi: "विकेंद्रीकरण", word_en: "DECENTRALIZED", reward: 8 }
];

const EMERGENCY_QUESTIONS = [
  {
    question_hi: "Proof of Mind (POM) किस प्रकार की सर्वसम्मति पर आधारित है?",
    question_en: "What consensus protocol does Proof of Mind (POM) emphasize?",
    options_hi: ["Proof of Work", "Proof of Stake", "Proof of Intellect (PoI)", "Proof of Authority"],
    options_en: ["Proof of Work", "Proof of Stake", "Proof of Intellect (PoI)", "Proof of Authority"],
    correctIndex: 2,
    reward: 5
  }
];

// --- यूज़र सिंक API ---
app.post('/api/user/sync', async (req, res) => {
  try {
    const { telegram_id, username, first_name, start_param } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id is required" });

    const tidStr = String(telegram_id);
    let user = await User.findOne({ telegram_id: tidStr });

    let inviterId = null;
    if (start_param && typeof start_param === 'string' && start_param.startsWith("ref_")) {
      inviterId = start_param.replace("ref_", "").trim();
      if (inviterId === tidStr) inviterId = null;
    }

    let isNewReferral = false;
    if (!user) {
      user = new User({ telegram_id: tidStr, username: username || "", first_name: first_name || "", referrer_id: inviterId });
      await user.save();
      if (inviterId) isNewReferral = true;
    } else {
      if (!user.referrer_id && inviterId) { user.referrer_id = inviterId; isNewReferral = true; }
      await user.save();
    }

    if (isNewReferral && user.referrer_id) {
      const up1 = await User.findOneAndUpdate({ telegram_id: user.referrer_id }, { $addToSet: { "referrals.tier1": tidStr } }, { new: true });
      if (up1 && up1.referrer_id) {
        const up2 = await User.findOneAndUpdate({ telegram_id: up1.referrer_id }, { $addToSet: { "referrals.tier2": tidStr } }, { new: true });
        if (up2 && up2.referrer_id) {
          await User.findOneAndUpdate({ telegram_id: up2.referrer_id }, { $addToSet: { "referrals.tier3": tidStr } });
        }
      }
    }

    const freshUser = await User.findOne({ telegram_id: tidStr });
    async function resolveNames(ids) {
      if (!ids || ids.length === 0) return [];
      const found = await User.find({ telegram_id: { $in: ids } }).select('telegram_id username first_name');
      return found.map(f => ({ telegram_id: f.telegram_id, name: f.first_name || f.username || `Pioneer_${f.telegram_id.slice(-4)}` }));
    }

    res.json({
      success: true,
      user: {
        telegram_id: freshUser.telegram_id,
        balance: Number(freshUser.balance || 0),
        energy: freshUser.energy,
        quizLevel: freshUser.quizLevel,
        mineLevel: freshUser.mineLevel,
        isVerified: freshUser.isVerified,
        tonAddress: freshUser.tonAddress,
        unclaimedCommission: Number(freshUser.unclaimedCommission || 0),
        completedTasks: freshUser.completedTasks || [],
        referrals: {
          tier1: freshUser.referrals?.tier1 || [],
          tier2: freshUser.referrals?.tier2 || [],
          tier3: freshUser.referrals?.tier3 || [],
          tier1Details: await resolveNames(freshUser.referrals?.tier1),
          tier2Details: await resolveNames(freshUser.referrals?.tier2),
          tier3Details: await resolveNames(freshUser.referrals?.tier3)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/game/mine-reward', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });

    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    let baseReward = 3;
    if (user.mineLevel >= 81) baseReward = 30;
    else if (user.mineLevel >= 51) baseReward = 15;
    else if (user.mineLevel >= 21) baseReward = 8;

    const reward = user.isVerified ? (baseReward * 2) : baseReward;
    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { $inc: { balance: reward, mineLevel: 1 } },
      { new: true }
    );

    res.json({ success: true, balance: updatedUser.balance, mineLevel: updatedUser.mineLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/quiz-reward', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });

    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    let baseReward = user.quizLevel >= 81 ? 20 : (user.quizLevel >= 51 ? 10 : (user.quizLevel >= 21 ? 5 : 2));
    const reward = user.isVerified ? (baseReward * 2) : baseReward;
    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { $inc: { balance: reward, quizLevel: 1 } },
      { new: true }
    );

    res.json({ success: true, balance: updatedUser.balance, quizLevel: updatedUser.quizLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/referral/claim', async (req, res) => {
  try {
    const { telegram_id, clientUnclaimed } = req.body;
    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const dbUnclaimed = Number(user.unclaimedCommission || 0);
    const claimable = Math.floor(dbUnclaimed > 0 ? dbUnclaimed : Number(clientUnclaimed || 0));
    if (claimable <= 0) return res.status(400).json({ success: false, error: "कोई क्लेम करने योग्य कमीशन नहीं है" });

    const remainder = Math.max(0, Number((dbUnclaimed - claimable).toFixed(2)));
    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { $inc: { balance: claimable }, $set: { unclaimedCommission: remainder } },
      { new: true }
    );

    res.json({ success: true, claimed: claimable, balance: updatedUser.balance, unclaimedCommission: updatedUser.unclaimedCommission });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/task/claim', async (req, res) => {
  try {
    const { telegram_id, taskId, reward } = req.body;
    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { $inc: { balance: Number(reward) || 50 }, $addToSet: { completedTasks: taskId } },
      { new: true }
    );
    res.json({ success: true, balance: updatedUser.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/verify-ton', async (req, res) => {
  try {
    const { telegram_id, tonAddress } = req.body;
    await User.updateOne({ telegram_id: String(telegram_id) }, { $set: { isVerified: true, tonAddress: tonAddress || "Verified" } });
    res.json({ success: true, isVerified: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const usersData = await User.find().select('balance');
    const totalMinedPom = usersData.reduce((acc, curr) => acc + (curr.balance || 0), 0);
    res.json({ success: true, stats: { totalUsers, verifiedUsers, totalMinedPom } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/question/lookup', async (req, res) => {
  try {
    const qId = parseInt(req.query.id);
    const q = await Question.findOne({ id: qId });
    if (!q) return res.status(404).json({ success: false, error: "Question not found" });
    res.json({ success: true, question: q });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/question/update', async (req, res) => {
  try {
    const { id, question_hi, question_en, options_hi, options_en, correctIndex } = req.body;
    const updated = await Question.findOneAndUpdate(
      { id: Number(id) },
      { $set: { question_hi, question_en, options_hi, options_en, correctIndex: Number(correctIndex) } },
      { new: true, upsert: true }
    );
    res.json({ success: true, question: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/puzzle/lookup', async (req, res) => {
  try {
    const level = parseInt(req.query.level);
    const p = await PuzzleWord.findOne({ level: level });
    if (!p) return res.status(404).json({ success: false, error: "Puzzle level not found" });
    res.json({ success: true, puzzle: p });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/puzzle/update', async (req, res) => {
  try {
    const { level, word_hi, word_en, reward } = req.body;
    const updated = await PuzzleWord.findOneAndUpdate(
      { level: Number(level) },
      { $set: { word_hi, word_en, reward: Number(reward) || 3 } },
      { new: true, upsert: true }
    );
    res.json({ success: true, puzzle: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- पज़ल वर्ड फेच API (रोबस्ट लेवल-बेस्ड फॉलबैक के साथ) ---
app.get('/api/puzzle/word', async (req, res) => {
  try {
    const level = parseInt(req.query.level) || 1;
    let wordDoc = await PuzzleWord.findOne({ level: level });

    if (!wordDoc) {
      const totalWords = await PuzzleWord.countDocuments();
      if (totalWords > 0) {
        const cycleLevel = ((level - 1) % totalWords) + 1;
        wordDoc = await PuzzleWord.findOne({ level: cycleLevel });
      }
    }

    if (!wordDoc) {
      // डेटाबेस खाली होने पर विभिन्न लंबाई वाले डाइवर्स फॉलबैक एरे से शब्द चुनें
      const index = (level - 1) % DIVERSE_PUZZLE_WORDS.length;
      wordDoc = { ...DIVERSE_PUZZLE_WORDS[index], level: level };
    }

    res.json({ success: true, puzzle: wordDoc });
  } catch (err) {
    const level = parseInt(req.query.level) || 1;
    const index = (level - 1) % DIVERSE_PUZZLE_WORDS.length;
    res.json({ success: true, puzzle: { ...DIVERSE_PUZZLE_WORDS[index], level: level } });
  }
});

app.get('/api/quiz/random', async (req, res) => {
  try {
    let rawDoc = null;
    const count = await Question.countDocuments();
    if (count > 0) {
      const randomQuestions = await Question.aggregate([{ $sample: { size: 1 } }]);
      if (randomQuestions && randomQuestions.length > 0) rawDoc = randomQuestions[0];
    }

    let formattedQuestion = null;
    if (rawDoc) {
      const qText = rawDoc.question_hi || rawDoc.question || rawDoc.question_en;
      const opts = (rawDoc.options_hi && rawDoc.options_hi.length > 0) ? rawDoc.options_hi : (rawDoc.options || rawDoc.options_en || []);
      let cIdx = rawDoc.correctIndex;
      if (cIdx === undefined || cIdx === null) {
        cIdx = opts.indexOf(rawDoc.answer);
        if (cIdx === -1) cIdx = 0;
      }
      formattedQuestion = { question_hi: qText, question_en: rawDoc.question_en || qText, options_hi: opts, options_en: opts, correctIndex: cIdx, reward: rawDoc.reward || 10 };
    } else {
      formattedQuestion = EMERGENCY_QUESTIONS[0];
    }
    res.json({ success: true, question: formattedQuestion });
  } catch (err) {
    res.json({ success: true, question: EMERGENCY_QUESTIONS[0] });
  }
});

app.get('/', (req, res) => {
  res.send('Proof of Mind API is Running live & secure!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
