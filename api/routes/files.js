const router = require('express').Router();
const { getFiles, getFile, downloadFile, createFile, updateFile, deleteFile, rateFile, getTrending } = require('../controllers/filesController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', getFiles);
router.get('/trending', getTrending);
router.get('/:slug', getFile);
router.post('/:id/download', auth, downloadFile);
router.post('/:id/rate', auth, rateFile);
router.post('/', auth, adminOnly, createFile);
router.put('/:id', auth, adminOnly, updateFile);
router.delete('/:id', auth, adminOnly, deleteFile);

module.exports = router;
