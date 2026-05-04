require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Security & logging
app.use(helmet());
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

// Routes
app.use('/api/auth', require('./api/routes/auth'));
app.use('/api/files', require('./api/routes/files'));
app.use('/api/categories', require('./api/routes/categories'));
app.use('/api/favorites', require('./api/routes/favorites'));
app.use('/api/payments', require('./api/routes/payments'));
app.use('/api/admin', require('./api/routes/admin'));
app.use('/api/upload', require('./api/routes/upload'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve frontend static files
app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile('index.html', { root: 'public' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
