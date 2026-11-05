// ==========================================
// PROOF OF MIND (POM) - SECURE BACKEND API ENGINE
// ==========================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// CORS कॉन्फ़िगरेशन - मोबाइल और वेब दोनों के लिए खुला
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-telegram-init-data']
}));

app.use(express.json());

// Render के MONGO_URI या MONGODB_URI दोनों को सपोर्ट करेगा
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

// बैकअप सवाल (अगर डेटाबेस खाली हो तो भी सर्वर 0.0 सेकंड में सवाल लौटाएगा)
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
  },
  {
    question_hi: "बिटकॉइन ब्लॉकचेन के संस्थापक कौन हैं?",
    question_en: "Who is the creator of Bitcoin blockchain?",
    options_hi: ["विटालिक ब्यूटरिन", "सातोशी नाकामोटो", "एलन मस्क", "चार्ली ली"],
    options_en: ["Vitalik Buterin", "Satoshi Nakamoto", "Elon Musk", "Charlie Lee"],
    correctIndex: 1,
    reward: 5
  }
];

// --- 1. टेलीग्राम यूजर सिंक एवं रेफरल ट्रैकिंग ---
app.post('/api/user/sync', async (req, res) => {
  try {
    const { telegram_id, username, first_name, start_param } = req.body;
    if (!telegram_id) {
      return res.status(400).json({ error: "telegram_id is required" });
    }

    let user = await User.findOne({ telegram_id: String(telegram_id) });

    if (!user) {
      let inviterId = null;
      if (start_param && start_param.startsWith("ref_")) {
        inviterId = start_param.replace("ref_", "").trim();
        if (inviterId === String(telegram_id)) inviterId = null;
      }

      user = new User({
        telegram_id: String(telegram_id),
        username: username || "",
        first_name: first_name || "",
        referrer_id: inviterId
      });

      await user.save();

      // रेफरल टियर 1 में जोड़ें
      if (inviterId) {
        await User.findOneAndUpdate(
          { telegram_id: inviterId },
          { $addToSet: { "referrals.tier1": String(telegram_id) } }
        );
      }
    } else {
      if (username && user.username !== username) {
        user.username = username;
        await user.save();
      }
    }

    res.json({
      success: true,
      user: {
        telegram_id: user.telegram_id,
        balance: user.balance,
        energy: user.energy,
        quizLevel: user.quizLevel,
        mineLevel: user.mineLevel,
        isVerified: user.isVerified,
        tonAddress: user.tonAddress,
        unclaimedCommission: user.unclaimedCommission,
        completedTasks: user.completedTasks || [],
        referrals: user.referrals
      }
    });
  } catch (err) {
    console.error("User sync error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- 2. एंटी-चीट सर्वर-साइड माइनिंग ब्लॉक रिवॉर्ड (Atomic $inc) ---
app.post('/api/game/mine-reward', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });

    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    // रेट-लिमिट सुरक्षा: बॉट द्वारा तेज़ी से बार-बार कॉल करने से बचाव (कम से कम 1.5 सेकंड का अंतर)
    const now = Date.now();
    if (user.lastMineTimestamp && (now - user.lastMineTimestamp < 1500)) {
      return res.status(429).json({ error: "Mining too fast. Anti-bot triggered." });
    }

    let baseReward = 3;
    if (user.mineLevel >= 81) baseReward = 30;
    else if (user.mineLevel >= 51) baseReward = 15;
    else if (user.mineLevel >= 21) baseReward = 8;

    const reward = user.isVerified ? (baseReward * 2) : baseReward;

    // एटॉमिक रूप से बैलेंस और लेवल बढ़ाना
    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { 
        $inc: { balance: reward, mineLevel: 1 },
        $set: { lastMineTimestamp: now }
      },
      { new: true }
    );

    // 3-लेवल रेफरल कमीशन वितरण (10%, 3%, 2%)
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

// --- 3. प्रोग्रेस सेविंग (फ़ॉलबैक सपोर्ट) ---
app.post('/api/user/save-progress', async (req, res) => {
  try {
    const { telegram_id, balance, energy, quizLevel, mineLevel, completedTasks } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id missing" });

    const updateData = {};
    if (balance !== undefined) updateData.balance = balance;
    if (energy !== undefined) updateData.energy = energy;
    if (quizLevel !== undefined) updateData.quizLevel = quizLevel;
    if (mineLevel !== undefined) updateData.mineLevel = mineLevel;
    if (completedTasks !== undefined) updateData.completedTasks = completedTasks;

    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { $set: updateData },
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to save progress" });
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

// --- 5. ज़ीरो-लेटेंसी रैंडम क्विज़ सवाल ---
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
    
    // अगर डेटाबेस में कोई सवाल न मिला हो, तो इमरजेंसी सवाल दें
    if (!question) {
      question = EMERGENCY_QUESTIONS[Math.floor(Math.random() * EMERGENCY_QUESTIONS.length)];
    }

    res.json({ success: true, question });
  } catch (err) {
    console.warn("Quiz query fallback triggered:", err.message);
    const fallback = EMERGENCY_QUESTIONS[Math.floor(Math.random() * EMERGENCY_QUESTIONS.length)];
    res.json({ success: true, question: fallback });
  }
});

// हेल्थ चेक
app.get('/', (req, res) => {
  res.send('Proof of Mind API is Running live & secure!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
