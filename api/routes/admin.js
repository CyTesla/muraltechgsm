const router = require('express').Router();
const { getDashboardStats, getUsers, updateUserRole, getRecentDownloads } = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/downloads', getRecentDownloads);

module.exports = router;
