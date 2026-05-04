const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

const slugify = (text) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// GET /api/files - list with filters, search, pagination
const getFiles = async (req, res) => {
    const {
        page = 1, limit = 10, type, category, search,
        sort = 'created_at', order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['f.is_published = true'];
    const params = [];
    let i = 1;

    if (type) { conditions.push(`f.file_type = $${i++}`); params.push(type); }
    if (category) { conditions.push(`c.slug = $${i++}`); params.push(category); }
    if (search) {
        conditions.push(`(f.title ILIKE $${i} OR f.description ILIKE $${i})`);
        params.push(`%${search}%`); i++;
    }

    const where = conditions.join(' AND ');
    const validSorts = { created_at: 'f.created_at', view_count: 'f.view_count', download_count: 'f.download_count' };
    const sortCol = validSorts[sort] || 'f.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
        const countRes = await db.query(
            `SELECT COUNT(*) FROM files f LEFT JOIN categories c ON f.category_id = c.id WHERE ${where}`,
            params
        );

        const { rows } = await db.query(
            `SELECT f.id, f.title, f.slug, f.description, f.file_type, f.price, f.version,
                    f.thumbnail_url, f.platform, f.is_verified, f.view_count, f.download_count,
                    f.created_at, f.updated_at,
                    c.name AS category_name, c.slug AS category_slug,
                    u.username AS author,
                    COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) AS avg_rating,
                    COUNT(DISTINCT r.id) AS rating_count
             FROM files f
             LEFT JOIN categories c ON f.category_id = c.id
             LEFT JOIN users u ON f.author_id = u.id
             LEFT JOIN ratings r ON f.id = r.file_id
             WHERE ${where}
             GROUP BY f.id, c.name, c.slug, u.username
             ORDER BY ${sortCol} ${sortOrder}
             LIMIT $${i} OFFSET $${i + 1}`,
            [...params, limit, offset]
        );

        res.json({
            files: rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(countRes.rows[0].count / limit),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch files', details: err.message });
    }
};

// GET /api/files/:slug
const getFile = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT f.*, c.name AS category_name, c.slug AS category_slug,
                    u.username AS author,
                    COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) AS avg_rating,
                    COUNT(DISTINCT r.id) AS rating_count
             FROM files f
             LEFT JOIN categories c ON f.category_id = c.id
             LEFT JOIN users u ON f.author_id = u.id
             LEFT JOIN ratings r ON f.id = r.file_id
             WHERE f.slug = $1 AND f.is_published = true
             GROUP BY f.id, c.name, c.slug, u.username`,
            [req.params.slug]
        );

        if (!rows.length) return res.status(404).json({ error: 'File not found' });

        // Increment view count
        await db.query('UPDATE files SET view_count = view_count + 1 WHERE id = $1', [rows[0].id]);

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch file' });
    }
};

// POST /api/files/:id/download
const downloadFile = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM files WHERE id = $1 AND is_published = true', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'File not found' });

        const file = rows[0];

        // Check access for paid/premium
        if (file.file_type === 'premium') {
            if (!req.user || !['admin', 'premium'].includes(req.user.role)) {
                return res.status(403).json({ error: 'Premium access required' });
            }
        }

        if (file.file_type === 'paid') {
            if (!req.user) return res.status(403).json({ error: 'Login required' });
            const order = await db.query(
                'SELECT id FROM orders WHERE user_id = $1 AND file_id = $2 AND status = $3',
                [req.user.id, file.id, 'completed']
            );
            if (!order.rows.length) return res.status(403).json({ error: 'Purchase required' });
        }

        // Track download
        await db.query(
            'INSERT INTO downloads (file_id, user_id, ip_address) VALUES ($1, $2, $3)',
            [file.id, req.user?.id || null, req.ip]
        );
        await db.query('UPDATE files SET download_count = download_count + 1 WHERE id = $1', [file.id]);

        res.json({ download_url: file.file_url });
    } catch (err) {
        res.status(500).json({ error: 'Download failed' });
    }
};

// POST /api/files (admin)
const createFile = async (req, res) => {
    const { title, description, category_id, file_type, price, version, platform, file_url, thumbnail_url } = req.body;
    try {
        const slug = slugify(title) + '-' + Date.now();
        const { rows } = await db.query(
            `INSERT INTO files (id, title, slug, description, category_id, author_id, file_type, price, version, platform, file_url, thumbnail_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
            [uuidv4(), title, slug, description, category_id, req.user.id, file_type || 'free', price || 0, version, platform || 'Windows', file_url, thumbnail_url]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create file', details: err.message });
    }
};

// PUT /api/files/:id (admin)
const updateFile = async (req, res) => {
    const fields = ['title', 'description', 'category_id', 'file_type', 'price', 'version', 'platform', 'file_url', 'thumbnail_url', 'is_published'];
    const updates = [];
    const params = [];
    let i = 1;

    fields.forEach(f => {
        if (req.body[f] !== undefined) {
            updates.push(`${f} = $${i++}`);
            params.push(req.body[f]);
        }
    });

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);

    try {
        const { rows } = await db.query(
            `UPDATE files SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
            params
        );
        if (!rows.length) return res.status(404).json({ error: 'File not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
};

// DELETE /api/files/:id (admin)
const deleteFile = async (req, res) => {
    try {
        const { rowCount } = await db.query('DELETE FROM files WHERE id = $1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ error: 'File not found' });
        res.json({ message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
};

// POST /api/files/:id/rate
const rateFile = async (req, res) => {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    try {
        await db.query(
            'INSERT INTO ratings (file_id, user_id, rating) VALUES ($1, $2, $3) ON CONFLICT (file_id, user_id) DO UPDATE SET rating = $3',
            [req.params.id, req.user.id, rating]
        );
        const { rows } = await db.query(
            'SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) AS avg_rating, COUNT(*) AS count FROM ratings WHERE file_id = $1',
            [req.params.id]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Rating failed' });
    }
};

// GET /api/files/trending
const getTrending = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT f.id, f.title, f.slug, f.thumbnail_url, f.file_type, f.view_count, f.download_count,
                    COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) AS avg_rating
             FROM files f
             LEFT JOIN ratings r ON f.id = r.file_id
             WHERE f.is_published = true
             GROUP BY f.id
             ORDER BY f.view_count DESC LIMIT 10`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch trending' });
    }
};

module.exports = { getFiles, getFile, downloadFile, createFile, updateFile, deleteFile, rateFile, getTrending };
