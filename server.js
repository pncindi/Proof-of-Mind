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
  referrals: {
    tier1: [{ type: String }],
    tier2: [{ type: String }],
    tier3: [{ type: String }]
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 1. यूज़र सिंक एवं रेफरल ट्रैकिंग
app.post('/api/user/sync', async (req, res) => {
  try {
    const { telegram_id, username, first_name, start_param } = req.body;
    if (!telegram_id) return res.status(400).json({ error: "telegram_id missing" });

    let user = await User.findOne({ telegram_id: String(telegram_id) });

    if (!user) {
      let referrerId = null;
      if (start_param && start_param.startsWith('ref_')) {
        referrerId = start_param.replace('ref_', '').trim();
        if (referrerId === String(telegram_id)) referrerId = null;
      }

      user = new User({
        telegram_id: String(telegram_id),
        username: username || "",
        first_name: first_name || "",
        referrer_id: referrerId
      });
      await user.save();

      // 3-लेवल रेफरल नेटवर्क में ID जोड़ना
      if (referrerId) {
        const upline1 = await User.findOne({ telegram_id: referrerId });
        if (upline1) {
          if (!upline1.referrals.tier1.includes(user.telegram_id)) {
            upline1.referrals.tier1.push(user.telegram_id);
            await upline1.save();
          }

          if (upline1.referrer_id) {
            const upline2 = await User.findOne({ telegram_id: upline1.referrer_id });
            if (upline2 && !upline2.referrals.tier2.includes(user.telegram_id)) {
              upline2.referrals.tier2.push(user.telegram_id);
              await upline2.save();
            }

            if (upline2 && upline2.referrer_id) {
              const upline3 = await User.findOne({ telegram_id: upline2.referrer_id });
              if (upline3 && !upline3.referrals.tier3.includes(user.telegram_id)) {
                upline3.referrals.tier3.push(user.telegram_id);
                await upline3.save();
              }
            }
          }
        }
      }
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Proof of Mind API is Running live!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
