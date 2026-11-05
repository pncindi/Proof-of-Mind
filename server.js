const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
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

// User Schema
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
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
// --- क्विज़ प्रश्न स्कीमा ---
const questionSchema = new mongoose.Schema({
    question_hi: { type: String, required: true },
    question_en: { type: String, required: true },
    options_hi: [{ type: String, required: true }],
    options_en: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    reward: { type: Number, default: 5 }
});

const Question = mongoose.model('Question', questionSchema);
// 1. यूज़र सिंक एवं रेफरल ट्रैकिंग
app.post('/api/user/sync', async (req, res) => {
    try {
        const { telegram_id, username, first_name, start_param } = req.body;
        if (!telegram_id) {
            return res.status(400).json({ error: "telegram_id is required" });
        }

        let user = await User.findOne({ telegram_id });

        // अगर नया यूज़र है
        if (!user) {
            let inviterId = null;
            if (start_param && start_param.startsWith("ref_")) {
                inviterId = start_param.replace("ref_", "").trim();
                if (inviterId === telegram_id) inviterId = null;
            }

            user = new User({
                telegram_id,
                username,
                first_name,
                referrer_id: inviterId
            });

            await user.save();

            // इनवाइटर के Tier 1 में जोड़ें
            if (inviterId) {
                await User.findOneAndUpdate(
                    { telegram_id: inviterId },
                    { $addToSet: { "referrals.tier1": telegram_id } }
                );
            }
        } else {
            // पुराना यूज़र है तो जानकारी अपडेट करें
            if (username) user.username = username;
            await user.save();
        }

        // फ्रंटएंड को ताज़ा डेटा रिटर्न करें
        res.json({
            success: true,
            user: {
                telegram_id: user.telegram_id,
                balance: user.balance,
                energy: user.energy,
                quizLevel: user.quizLevel,
                mineLevel: user.mineLevel,
                completedTasks: user.completedTasks || [],
                referrals: user.referrals
            }
        });
    } catch (err) {
        console.error("User sync error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
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
            { telegram_id },
            { $set: updateData },
            { new: true }
        );

        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error("Save progress error:", err);
        res.status(500).json({ error: "Failed to save progress" });
    }
});
// 2. माइनिंग ब्लॉक रिवॉर्ड और कमीशन डिस्ट्रीब्यूशन
app.post('/api/game/mine-reward', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const reward = user.isVerified ? 6 : 3;
    user.balance += reward;
    user.mineLevel += 1;
    await user.save();

    // अपलाइन को कमीशन जोड़ना (10%, 3%, 2%)
    if (user.referrer_id) {
      const up1 = await User.findOne({ telegram_id: user.referrer_id });
      if (up1) {
        up1.unclaimedCommission += (reward * 0.10);
        await up1.save();

        if (up1.referrer_id) {
          const up2 = await User.findOne({ telegram_id: up1.referrer_id });
          if (up2) {
            up2.unclaimedCommission += (reward * 0.03);
            await up2.save();

            if (up2.referrer_id) {
              const up3 = await User.findOne({ telegram_id: up2.referrer_id });
              if (up3) {
                up3.unclaimedCommission += (reward * 0.02);
                await up3.save();
              }
            }
          }
        }
      }
    }

    res.json({ success: true, balance: user.balance, mineLevel: user.mineLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 0.3 TON वेरिफिकेशन स्टेटस सेव करना
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
// 3. रैंडम क्विज़ सवाल मंगाने का API
app.get('/api/quiz/random', async (req, res) => {
    try {
        const randomQuestion = await Question.aggregate([{ $sample: { size: 1 } }]);
        
        if (!randomQuestion || randomQuestion.length === 0) {
            return res.status(404).json({ error: "No questions found in database" });
        }

        res.json({ success: true, question: randomQuestion[0] });
    } catch (err) {
        console.error("Quiz fetch error:", err);
        res.status(500).json({ error: "Failed to fetch question" });
    }
});
// Health check endpoint
app.get('/', (req, res) => {
  res.send('Proof of Mind API is Running live!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
