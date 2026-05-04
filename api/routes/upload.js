const router = require('express').Router();
const { upload, uploadFile } = require('../controllers/uploadController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/', auth, adminOnly, upload.single('file'), uploadFile);

module.exports = router;
