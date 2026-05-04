const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { rows } = await db.query('SELECT id, username, email, role FROM users WHERE id = $1', [decoded.id]);
        if (!rows.length) return res.status(401).json({ error: 'User not found' });
        req.user = rows[0];
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

const premiumOrAdmin = (req, res, next) => {
    if (!['admin', 'premium'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Premium access required' });
    }
    next();
};

module.exports = { auth, adminOnly, premiumOrAdmin };
