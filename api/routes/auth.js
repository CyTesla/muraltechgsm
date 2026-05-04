const router = require('express').Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    validate,
], register);

router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
], login);

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;
