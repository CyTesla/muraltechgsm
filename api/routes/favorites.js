const router = require('express').Router();
const { getFavorites, toggleFavorite } = require('../controllers/favoritesController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getFavorites);
router.post('/:id', auth, toggleFavorite);

module.exports = router;
