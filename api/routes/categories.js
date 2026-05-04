const router = require('express').Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.*, COUNT(f.id) AS file_count
             FROM categories c
             LEFT JOIN files f ON c.id = f.category_id AND f.is_published = true
             GROUP BY c.id ORDER BY file_count DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
