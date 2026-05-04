const db = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const [files, users, downloads, orders, categories] = await Promise.all([
            db.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE file_type=\'free\') AS free, COUNT(*) FILTER (WHERE file_type=\'paid\') AS paid, COUNT(*) FILTER (WHERE file_type=\'premium\') AS premium FROM files'),
            db.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE role=\'premium\') AS premium FROM users'),
            db.query('SELECT COUNT(*) AS total FROM downloads'),
            db.query('SELECT COUNT(*) AS total, COALESCE(SUM(amount),0) AS revenue FROM orders WHERE status=\'completed\''),
            db.query('SELECT c.name, COUNT(f.id) AS file_count FROM categories c LEFT JOIN files f ON c.id = f.category_id GROUP BY c.id ORDER BY file_count DESC'),
        ]);

        res.json({
            files: files.rows[0],
            users: users.rows[0],
            downloads: downloads.rows[0],
            orders: orders.rows[0],
            categories: categories.rows,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

const getUsers = async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';

    if (search) {
        where = 'WHERE username ILIKE $1 OR email ILIKE $1';
        params.push(`%${search}%`);
    }

    try {
        const { rows } = await db.query(
            `SELECT id, username, email, role, is_verified, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const updateUserRole = async (req, res) => {
    const { role } = req.body;
    if (!['user', 'admin', 'premium'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    try {
        const { rows } = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
            [role, req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
};

const getRecentDownloads = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT d.downloaded_at, d.ip_address, f.title AS file_title, u.username
             FROM downloads d
             JOIN files f ON d.file_id = f.id
             LEFT JOIN users u ON d.user_id = u.id
             ORDER BY d.downloaded_at DESC LIMIT 50`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch downloads' });
    }
};

module.exports = { getDashboardStats, getUsers, updateUserRole, getRecentDownloads };
