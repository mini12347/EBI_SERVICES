const User = require('../models/utilisateur');
const Token = require('../models/jwt_tokens');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate Access and Refresh Tokens
const generateTokens = async (userId) => {
    const access_token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '1h',
    });
    
    const refresh_token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
        expiresIn: '7d',
    });

    const date_expiration = new Date();
    date_expiration.setHours(date_expiration.getHours() + 1);

    // Save tokens in database
    await Token.create({
        utilisateur: userId,
        access_token,
        refresh_token,
        date_expiration,
        actif: true
    });

    return { access_token, refresh_token };
};

// @desc    Register new user (client by default)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        if (!global.__dbConnected) {
            return res.status(503).json({
                message: 'Registration unavailable because the database is currently unreachable.',
                error: 'DB_UNAVAILABLE'
            });
        }

        const { fullname, email, telephone, password, entreprise } = req.body;

        if (!fullname || !email || !telephone || !password) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            fullname,
            email,
            telephone,
            password,
            entreprise,
            role: 'client' // Default to client as discussed
        });

        if (user) {
            const tokens = await generateTokens(user._id);

            // Generate email verification token
            const verifyToken = crypto.randomBytes(32).toString('hex');
            user.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
            user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
            await user.save();

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const verifyUrl = `${frontendUrl}?verify_token=${verifyToken}`;

            // Send verification email
            const emailSent = await sendEmail({
                to: user.email,
                subject: 'EBI Services – Verify Your Email Address',
                html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">EBI Services</h1>
  </div>
  <div style="padding: 20px; color: #374151;">
    <h2 style="color: #1e3a5f;">Welcome, ${user.fullname}!</h2>
    <p>Your account has been created successfully. Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${verifyUrl}" style="background: #1e3a5f; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email Address</a>
    </div>
    <p>This link expires in 24 hours. If you did not create this account, please ignore this email.</p>
    <p style="margin-top: 20px;">Best regards,<br><strong>The EBI Services Team</strong></p>
  </div>
  <div style="background: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #9ca3af;">
    &copy; ${new Date().getFullYear()} EBI Services. All rights reserved.
  </div>
</div>`
            });
            if (!emailSent) {
                console.log(`\n=== EMAIL FALLBACK === Verify URL for ${user.email}: ${verifyUrl}\n`);
            }

            res.status(201).json({
                _id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                ...tokens
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!global.__dbConnected) {
            return res.status(503).json({
                message: 'Authentication unavailable because the database is currently unreachable.',
                error: 'DB_UNAVAILABLE'
            });
        }

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (!user.emailVerified) {
                return res.status(403).json({ message: 'Please verify your email address before logging in. Check your inbox for the verification link.' });
            }
            const tokens = await generateTokens(user._id);
            res.json({
                _id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                ...tokens
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        // req.user is set in authMiddleware
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Forgot password – send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No account with that email exists' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?reset_token=${resetToken}`;

        const emailSent = await sendEmail({
            to: user.email,
            subject: 'EBI Services – Password Reset Request',
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">EBI Services</h1>
  </div>
  <div style="padding: 20px; color: #374151;">
    <h2 style="color: #1e3a5f;">Password Reset Request</h2>
    <p>You requested a password reset. Click the button below to set a new password. This link expires in 30 minutes.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${resetUrl}" style="background: #1e3a5f; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p style="font-size: 12px; color: #6b7280;">If the button does not work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #1e3a5f; word-break: break-all;">${resetUrl}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    <p style="margin-top: 20px;">Best regards,<br><strong>The EBI Services Team</strong></p>
  </div>
  <div style="background: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #9ca3af;">
    &copy; ${new Date().getFullYear()} EBI Services. All rights reserved.
  </div>
</div>`
        });
        if (!emailSent) {
            console.log(`\n=== EMAIL FALLBACK === Reset URL for ${user.email}: ${resetUrl}\n`);
        }

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        // Revoke all existing sessions so old tokens are invalidated
        await Token.updateMany({ utilisateur: user._id, actif: true }, { actif: false });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Verify email with token
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No account with that email exists' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        const verifyToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
        user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}?verify_token=${verifyToken}`;

        const emailSent = await sendEmail({
            to: user.email,
            subject: 'EBI Services – Verify Your Email Address',
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">EBI Services</h1>
  </div>
  <div style="padding: 20px; color: #374151;">
    <h2 style="color: #1e3a5f;">Verify Your Email</h2>
    <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${verifyUrl}" style="background: #1e3a5f; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email Address</a>
    </div>
    <p>If you did not request this, please ignore this email.</p>
    <p style="margin-top: 20px;">Best regards,<br><strong>The EBI Services Team</strong></p>
  </div>
  <div style="background: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #9ca3af;">
    &copy; ${new Date().getFullYear()} EBI Services. All rights reserved.
  </div>
</div>`
        });
        if (!emailSent) {
            console.log(`\n=== EMAIL FALLBACK === Verify URL for ${user.email}: ${verifyUrl}\n`);
        }

        res.json({ message: 'Verification email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
};
