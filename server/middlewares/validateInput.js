const { body, validationResult } = require('express-validator');
const { findByEmail } = require('../models/userModel');

const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (value) => {
      const user = await findByEmail(value);
      if (user) {
        throw new Error('Email is already registered');
      }
    })
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain a letter')
    .trim(),

  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => err.msg);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    next();
  },
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => err.msg);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    next();
  },
];

module.exports = { validateRegistration, validateLogin };
