const db = require('../config/db');

const getFavorites = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT f.id, f.title, f.slug, f.thumbnail_url, f.file_type, f.view_count, f.download_count, fav.created_at AS saved_at
             FROM favorites fav
             JOIN files f ON fav.file_id = f.id
             WHERE fav.user_id = $1
             ORDER BY fav.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
};

const toggleFavorite = async (req, res) => {
    try {
        const exists = await db.query('SELECT id FROM favorites WHERE user_id = $1 AND file_id = $2', [req.user.id, req.params.id]);
        if (exists.rows.length) {
            await db.query('DELETE FROM favorites WHERE user_id = $1 AND file_id = $2', [req.user.id, req.params.id]);
            return res.json({ favorited: false });
        }
        await db.query('INSERT INTO favorites (user_id, file_id) VALUES ($1, $2)', [req.user.id, req.params.id]);
        res.json({ favorited: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
};

module.exports = { getFavorites, toggleFavorite };
