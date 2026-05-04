const router = require('express').Router();
const { createCheckout, stripeWebhook, getOrders } = require('../controllers/paymentsController');
const { auth } = require('../middleware/auth');

router.post('/webhook', stripeWebhook);
router.post('/checkout', auth, createCheckout);
router.get('/orders', auth, getOrders);

module.exports = router;
