const jwt = require('jsonwebtoken');
const User = require('../models/utilisateur');
const Token = require('../models/jwt_tokens');

const authMiddleware = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

            // Check if token is active in the database
            const activeToken = await Token.findOne({ access_token: token, actif: true });
            if (!activeToken) {
                return res.status(401).json({ message: 'Not authorized, token revoked or inactive' });
            }

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            if (error.name !== 'TokenExpiredError') {
                console.error(error);
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = authMiddleware;
