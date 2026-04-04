const express = require('express');
const router = express.Router();
const { getAllQuestions } = require('../models/questionModel');
const { findByResetToken, updatePassword } = require('../models/userModel');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// GET /api/questions - Fetch all quiz questions from static JSON
router.get('/', async (req, res) => {
  try {
    const questions = await getAllQuestions();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

// POST /reset - Handle password reset completion
router.post('/reset', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: '❌ Token and new password are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await findByResetToken(hashedToken);

    if (!user) {
      return res.status(400).json({ success: false, message: '❌ Invalid or expired token.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: '❌ Password must be at least 8 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await updatePassword(user.id, hashedPassword);

    res.status(200).json({ success: true, message: '✅ Password has been reset successfully.' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error resetting password:`, error.message);
    res.status(500).json({
      success: false,
      message: '❌ An error occurred while resetting your password. Please try again later.',
    });
  }
});

module.exports = router;
