require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security & logging
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
}));

// Serve static files first
app.use(express.static(path.join(__dirname, 'public')));

// Health check (no DB needed)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API Routes — only load if DB is configured
if (process.env.DATABASE_URL) {
    app.use('/api/auth', require('./api/routes/auth'));
    app.use('/api/files', require('./api/routes/files'));
    app.use('/api/categories', require('./api/routes/categories'));
    app.use('/api/favorites', require('./api/routes/favorites'));
    app.use('/api/payments', require('./api/routes/payments'));
    app.use('/api/admin', require('./api/routes/admin'));
    app.use('/api/upload', require('./api/routes/upload'));
} else {
    app.use('/api', (req, res) => {
        res.status(503).json({ error: 'Database not configured yet. Add DATABASE_URL to environment variables.' });
    });
}

// Catch-all: serve frontend for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Only listen when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
