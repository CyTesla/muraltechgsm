const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const exists = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (exists.rows.length) return res.status(400).json({ error: 'Email or username already taken' });

        const password_hash = await bcrypt.hash(password, 12);
        const { rows } = await db.query(
            'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [uuidv4(), username, email, password_hash]
        );

        res.status(201).json({ user: rows[0], token: generateToken(rows[0].id) });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, rows[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const { password_hash, ...user } = rows[0];
        res.json({ user, token: generateToken(user.id) });
    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, username, email, role, avatar_url, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const updateProfile = async (req, res) => {
    const { username, avatar_url } = req.body;
    try {
        const { rows } = await db.query(
            'UPDATE users SET username = COALESCE($1, username), avatar_url = COALESCE($2, avatar_url), updated_at = NOW() WHERE id = $3 RETURNING id, username, email, role, avatar_url',
            [username, avatar_url, req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
};

module.exports = { register, login, getProfile, updateProfile };
