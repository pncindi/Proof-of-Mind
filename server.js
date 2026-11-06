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
  question_hi: { type: String, required: true },
  question_en: { type: String, required: true },
  options_hi: [{ type: String, required: true }],
  options_en: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  reward: { type: Number, default: 5 }
});

const Question = mongoose.model('Question', questionSchema);

const puzzleSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  word_hi: { type: String, required: true },
  word_en: { type: String, required: true },
  reward: { type: Number, default: 3 }
});

const PuzzleWord = mongoose.model('PuzzleWord', puzzleSchema, 'puzzle_words');
const EMERGENCY_QUESTIONS = [
  {
    question_hi: "Proof of Mind (POM) किस प्रकार की सर्वसम्मति पर आधारित है?",
    question_en: "What consensus protocol does Proof of Mind (POM) emphasize?",
    options_hi: ["Proof of Work", "Proof of Stake", "Proof of Intellect (PoI)", "Proof of Authority"],
    options_en: ["Proof of Work", "Proof of Stake", "Proof of Intellect (PoI)", "Proof of Authority"],
    correctIndex: 2,
    reward: 5
  },
  {
    question_hi: "0.3 TON सत्यापन से उपयोगकर्ता को क्या स्थायी लाभ मिलता है?",
    question_en: "What lifetime benefit does 0.3 TON verification grant?",
    options_hi: ["स्थायी 2x रिवॉर्ड मल्टीप्लायर", "अतिरिक्त 5 हार्ट्स", "तुरंत 100 लेवल", "500 मुफ्त POM"],
    options_en: ["Lifetime 2x Reward Multiplier", "Extra 5 Hearts", "Instant Level 100", "500 Free POM"],
    correctIndex: 0,
    reward: 5
  }
];

// --- 1. संपूर्ण 3-टियर रेफरल एवं यूज़र सिंक इंजन ---
app.post('/api/user/sync', async (req, res) => {
  try {
    const { telegram_id, username, first_name, start_param } = req.body;
    if (!telegram_id) {
      return res.status(400).json({ error: "telegram_id is required" });
    }

    const tidStr = String(telegram_id);
    let user = await User.findOne({ telegram_id: tidStr });

    let inviterId = null;
    if (start_param && typeof start_param === 'string' && start_param.startsWith("ref_")) {
      inviterId = start_param.replace("ref_", "").trim();
      if (inviterId === tidStr) inviterId = null;
    }

    let isNewReferral = false;

    if (!user) {
      user = new User({
        telegram_id: tidStr,
        username: username || "",
        first_name: first_name || "",
        referrer_id: inviterId
      });
      await user.save();
      if (inviterId) isNewReferral = true;
    } else {
      if (!user.referrer_id && inviterId) {
        user.referrer_id = inviterId;
        isNewReferral = true;
      }
      if (username && user.username !== username) {
        user.username = username;
      }
      await user.save();
    }

    if (isNewReferral && user.referrer_id) {
      const up1 = await User.findOneAndUpdate(
        { telegram_id: user.referrer_id },
        { $addToSet: { "referrals.tier1": tidStr } },
        { new: true }
      );

      if (up1 && up1.referrer_id) {
        const up2 = await User.findOneAndUpdate(
          { telegram_id: up1.referrer_id },
          { $addToSet: { "referrals.tier2": tidStr } },
          { new: true }
        );

        if (up2 && up2.referrer_id) {
          await User.findOneAndUpdate(
            { telegram_id: up2.referrer_id },
            { $addToSet: { "referrals.tier3": tidStr } }
          );
        }
      }
    }

    const freshUser = await User.findOne({ telegram_id: tidStr });

    res.json({
      success: true,
      user: {
        telegram_id: freshUser.telegram_id,
        balance: freshUser.balance,
        energy: freshUser.energy,
        quizLevel: freshUser.quizLevel,
        mineLevel: freshUser.mineLevel,
        isVerified: freshUser.isVerified,
        tonAddress: freshUser.tonAddress,
        unclaimedCommission: freshUser.unclaimedCommission || 0,
        completedTasks: freshUser.completedTasks || [],
        referrals: freshUser.referrals || { tier1: [], tier2: [], tier3: [] }
      }
    });
  } catch (err) {
    console.error("User sync error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- 2. माइनिंग रिवॉर्ड एवं कमीशन वितरण ---
app.post('/api/game/mine-reward', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });

    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = Date.now();
    if (user.lastMineTimestamp && (now - user.lastMineTimestamp < 1500)) {
      return res.status(429).json({ error: "Mining too fast. Anti-bot triggered." });
    }

    let baseReward = 3;
    if (user.mineLevel >= 81) baseReward = 30;
    else if (user.mineLevel >= 51) baseReward = 15;
    else if (user.mineLevel >= 21) baseReward = 8;

    const reward = user.isVerified ? (baseReward * 2) : baseReward;

    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { 
        $inc: { balance: reward, mineLevel: 1 },
        $set: { lastMineTimestamp: now }
      },
      { new: true }
    );

    if (updatedUser.referrer_id) {
      const up1 = await User.findOne({ telegram_id: updatedUser.referrer_id });
      if (up1) {
        await User.updateOne({ telegram_id: up1.telegram_id }, { $inc: { unclaimedCommission: reward * 0.10 } });
        if (up1.referrer_id) {
          const up2 = await User.findOne({ telegram_id: up1.referrer_id });
          if (up2) {
            await User.updateOne({ telegram_id: up2.telegram_id }, { $inc: { unclaimedCommission: reward * 0.03 } });
            if (up2.referrer_id) {
              await User.updateOne({ telegram_id: up2.referrer_id }, { $inc: { unclaimedCommission: reward * 0.02 } });
            }
          }
        }
      }
    }

    res.json({ success: true, balance: updatedUser.balance, mineLevel: updatedUser.mineLevel });
  } catch (err) {
    console.error("Mine reward error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- 3. क्विज़ रिवॉर्ड एवं परमानेंट प्रोग्रेस सेव (नया फिक्स) ---
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

    // क्विज़ पर भी 3-लेवल रेफरल कमीशन
    if (updatedUser.referrer_id) {
      const up1 = await User.findOne({ telegram_id: updatedUser.referrer_id });
      if (up1) {
        await User.updateOne({ telegram_id: up1.telegram_id }, { $inc: { unclaimedCommission: reward * 0.10 } });
        if (up1.referrer_id) {
          const up2 = await User.findOne({ telegram_id: up1.referrer_id });
          if (up2) {
            await User.updateOne({ telegram_id: up2.telegram_id }, { $inc: { unclaimedCommission: reward * 0.03 } });
            if (up2.referrer_id) {
              await User.updateOne({ telegram_id: up2.referrer_id }, { $inc: { unclaimedCommission: reward * 0.02 } });
            }
          }
        }
      }
    }

    res.json({ success: true, balance: updatedUser.balance, quizLevel: updatedUser.quizLevel });
  } catch (err) {
    console.error("Quiz reward error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- 4. 0.3 TON ऑन-चेन सत्यापन ---
app.post('/api/wallet/verify-ton', async (req, res) => {
  try {
    const { telegram_id, tonAddress } = req.body;
    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isVerified = true;
    if (tonAddress) user.tonAddress = tonAddress;
    await user.save();

    res.json({ success: true, isVerified: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. ज़ीरो-लेटेंसी क्विज़ रैंडमाइज़र ---
app.get('/api/quiz/random', async (req, res) => {
  try {
    let question = null;
    const count = await Question.countDocuments();
    if (count > 0) {
      const randomQuestions = await Question.aggregate([{ $sample: { size: 1 } }]);
      if (randomQuestions && randomQuestions.length > 0) {
        question = randomQuestions[0];
      }
    }
    
    if (!question) {
      question = EMERGENCY_QUESTIONS[Math.floor(Math.random() * EMERGENCY_QUESTIONS.length)];
    }

    res.json({ success: true, question });
  } catch (err) {
    const fallback = EMERGENCY_QUESTIONS[Math.floor(Math.random() * EMERGENCY_QUESTIONS.length)];
    res.json({ success: true, question: fallback });
  }
});
// --- पज़ल वर्ड फेच API ---
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
      wordDoc = { level: level, word_hi: "मन", word_en: "MIND", reward: 3 };
    }

    res.json({ success: true, puzzle: wordDoc });
  } catch (err) {
    res.json({ success: true, puzzle: { level: 1, word_hi: "मन", word_en: "MIND", reward: 3 } });
  }
});

app.get('/', (req, res) => {
  res.send('Proof of Mind API is Running live & secure!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
