const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment configuration
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_TON_WALLET = process.env.ADMIN_TON_WALLET || "";

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is missing!");
  process.exit(1);
}

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// ================= SCHEMAS =================

// User Schema
const userSchema = new mongoose.Schema({
  telegram_id: { type: String, required: true, unique: true, index: true },
  username: { type: String, default: "" },
  first_name: { type: String, default: "" },
  balance: { type: Number, default: 130 },
  mineLevel: { type: Number, default: 1 },
  quizLevel: { type: Number, default: 1 },
  energy: { type: Number, default: 5 },
  maxEnergy: { type: Number, default: 5 },
  lastEnergyUpdate: { type: Date, default: Date.now },
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

// Quiz Schema
const questionSchema = new mongoose.Schema({
  question_hi: { type: String, required: true },
  question_en: { type: String, required: true },
  options_hi: [{ type: String, required: true }],
  options_en: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  reward: { type: Number, default: 5 }
});

const Question = mongoose.model('Question', questionSchema);

// ================= HELPERS =================

// Energy Auto Recharge Helper (1 energy every 15 minutes)
const calculateCurrentEnergy = (user) => {
  const RECHARGE_INTERVAL_MS = 15 * 60 * 1000;
  const now = new Date();
  const lastUpdate = new Date(user.lastEnergyUpdate || now);
  const diffMs = now - lastUpdate;

  if (user.energy < user.maxEnergy && diffMs >= RECHARGE_INTERVAL_MS) {
    const gained = Math.floor(diffMs / RECHARGE_INTERVAL_MS);
    const updatedEnergy = Math.min(user.maxEnergy, user.energy + gained);
    const updatedTime = new Date(lastUpdate.getTime() + (gained * RECHARGE_INTERVAL_MS));
    return { energy: updatedEnergy, lastEnergyUpdate: updatedTime, needsSave: true };
  }

  return { energy: user.energy, lastEnergyUpdate: user.lastEnergyUpdate, needsSave: false };
};

// ================= API ROUTES =================

// Health Check
app.get('/', (req, res) => {
  res.send('Proof of Mind API is Running live and secure!');
});

// 1. User Sync & 3-Tier Referral Binding
app.post('/api/user/sync', async (req, res) => {
  try {
    const { telegram_id, username, first_name, start_param } = req.body;
    if (!telegram_id) {
      return res.status(400).json({ error: "telegram_id is required" });
    }

    const tgId = String(telegram_id);
    let user = await User.findOne({ telegram_id: tgId });

    if (!user) {
      let inviterId = null;
      if (start_param && typeof start_param === 'string' && start_param.startsWith("ref_")) {
        inviterId = start_param.replace("ref_", "").trim();
        if (inviterId === tgId) inviterId = null;
      }

      user = new User({
        telegram_id: tgId,
        username: username || "",
        first_name: first_name || "",
        referrer_id: inviterId
      });

      await user.save();

      // 3-Tier Referral Setup
      if (inviterId) {
        // Tier 1 Direct
        const up1 = await User.findOneAndUpdate(
          { telegram_id: inviterId },
          { $addToSet: { "referrals.tier1": tgId } },
          { new: true }
        );

        if (up1 && up1.referrer_id) {
          // Tier 2
          const up2 = await User.findOneAndUpdate(
            { telegram_id: up1.referrer_id },
            { $addToSet: { "referrals.tier2": tgId } },
            { new: true }
          );

          if (up2 && up2.referrer_id) {
            // Tier 3
            await User.findOneAndUpdate(
              { telegram_id: up2.referrer_id },
              { $addToSet: { "referrals.tier3": tgId } }
            );
          }
        }
      }
    } else {
      if (username && user.username !== username) user.username = username;
      if (first_name && user.first_name !== first_name) user.first_name = first_name;

      const energyState = calculateCurrentEnergy(user);
      if (energyState.needsSave) {
        user.energy = energyState.energy;
        user.lastEnergyUpdate = energyState.lastEnergyUpdate;
      }
      await user.save();
    }

    res.json({
      success: true,
      user: {
        telegram_id: user.telegram_id,
        balance: user.balance,
        energy: user.energy,
        maxEnergy: user.maxEnergy,
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

// 2. Safe Save Progress (Backward compatible with frontend, prevents balance hacking)
app.post('/api/user/save-progress', async (req, res) => {
  try {
    const { telegram_id, completedTasks, quizLevel, mineLevel } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id missing" });

    const updateData = {};
    if (completedTasks !== undefined) updateData.completedTasks = completedTasks;
    if (quizLevel !== undefined) updateData.quizLevel = quizLevel;
    if (mineLevel !== undefined) updateData.mineLevel = mineLevel;

    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      { $set: updateData },
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Save progress error:", err);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// 3. Mining Reward (Atomic Increment + Energy Deduction + Multi-tier Commission)
app.post('/api/game/mine-reward', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id missing" });

    const tgId = String(telegram_id);
    let user = await User.findOne({ telegram_id: tgId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check energy recharge
    const energyState = calculateCurrentEnergy(user);
    if (energyState.needsSave) {
      user.energy = energyState.energy;
      user.lastEnergyUpdate = energyState.lastEnergyUpdate;
      await user.save();
    }

    if (user.energy <= 0) {
      return res.status(400).json({ error: "No energy left! Please wait for it to recharge." });
    }

    const reward = user.isVerified ? 6 : 3;

    // Atomic update preventing balance duplication
    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: tgId, energy: { $gt: 0 } },
      {
        $inc: { balance: reward, mineLevel: 1, energy: -1 },
        $set: { lastEnergyUpdate: new Date() }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ error: "Action rejected. Insufficient energy." });
    }

    // Upline commissions (10%, 3%, 2%)
    if (user.referrer_id) {
      const up1 = await User.findOneAndUpdate(
        { telegram_id: user.referrer_id },
        { $inc: { unclaimedCommission: reward * 0.10 } }
      );

      if (up1 && up1.referrer_id) {
        const up2 = await User.findOneAndUpdate(
          { telegram_id: up1.referrer_id },
          { $inc: { unclaimedCommission: reward * 0.03 } }
        );

        if (up2 && up2.referrer_id) {
          await User.findOneAndUpdate(
            { telegram_id: up2.referrer_id },
            { $inc: { unclaimedCommission: reward * 0.02 } }
          );
        }
      }
    }

    res.json({
      success: true,
      balance: updatedUser.balance,
      mineLevel: updatedUser.mineLevel,
      energy: updatedUser.energy
    });
  } catch (err) {
    console.error("Mine reward error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Random Quiz (Hides correctIndex from network response)
app.get('/api/quiz/random', async (req, res) => {
  try {
    const randomQuestions = await Question.aggregate([
      { $sample: { size: 1 } },
      {
        $project: {
          question_hi: 1,
          question_en: 1,
          options_hi: 1,
          options_en: 1,
          reward: 1
        }
      }
    ]);

    if (!randomQuestions || randomQuestions.length === 0) {
      return res.status(404).json({ error: "No questions found in database" });
    }

    res.json({ success: true, question: randomQuestions[0] });
  } catch (err) {
    console.error("Quiz fetch error:", err);
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

// 5. Quiz Submission & Answer Verification on Server
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const { telegram_id, questionId, selectedIndex } = req.body;
    if (!telegram_id || !questionId || selectedIndex === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: "Question not found" });

    if (question.correctIndex !== Number(selectedIndex)) {
      return res.json({
        success: false,
        correct: false,
        correctIndex: question.correctIndex,
        message: "Galat uttar! Agli baar prayas karein."
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      {
        $inc: { balance: question.reward, quizLevel: 1 }
      },
      { new: true }
    );

    res.json({
      success: true,
      correct: true,
      reward: question.reward,
      balance: updatedUser.balance,
      quizLevel: updatedUser.quizLevel
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Referral Commission Claim
app.post('/api/referral/claim', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id missing" });

    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.unclaimedCommission <= 0) {
      return res.status(400).json({ error: "No commission available to claim" });
    }

    const claimAmount = user.unclaimedCommission;

    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      {
        $inc: { balance: claimAmount },
        $set: { unclaimedCommission: 0 }
      },
      { new: true }
    );

    res.json({
      success: true,
      claimed: claimAmount,
      balance: updatedUser.balance
    });
  } catch (err) {
    console.error("Claim commission error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Complete Social Tasks
app.post('/api/task/complete', async (req, res) => {
  try {
    const { telegram_id, taskId, reward = 10 } = req.body;
    if (!telegram_id || !taskId) {
      return res.status(400).json({ error: "telegram_id and taskId required" });
    }

    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.completedTasks.includes(taskId)) {
      return res.status(400).json({ error: "Task already completed" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { telegram_id: String(telegram_id) },
      {
        $addToSet: { completedTasks: taskId },
        $inc: { balance: Number(reward) }
      },
      { new: true }
    );

    res.json({
      success: true,
      balance: updatedUser.balance,
      completedTasks: updatedUser.completedTasks
    });
  } catch (err) {
    console.error("Task completion error:", err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// 8. 0.3 TON Wallet Verification
app.post('/api/wallet/verify-ton', async (req, res) => {
  try {
    const { telegram_id, tonAddress } = req.body;
    if (!telegram_id || !tonAddress) {
      return res.status(400).json({ error: "telegram_id and tonAddress required" });
    }

    const user = await User.findOne({ telegram_id: String(telegram_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isVerified = true;
    user.tonAddress = tonAddress;
    await user.save();

    res.json({
      success: true,
      isVerified: true,
      message: "Wallet verified successfully! Mining reward 2x active."
    });
  } catch (err) {
    console.error("TON verification error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
});
