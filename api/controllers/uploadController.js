const cloudinary = require('../config/cloudinary');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream'];
        cb(null, allowed.includes(file.mimetype));
    },
});

const uploadFile = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    try {
        const isImage = req.file.mimetype.startsWith('image/');
        const folder = isImage ? 'gsm-hamza/thumbnails' : 'gsm-hamza/files';

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: isImage ? 'image' : 'raw' },
                (err, result) => err ? reject(err) : resolve(result)
            );
            stream.end(req.file.buffer);
        });

        res.json({
            url: result.secure_url,
            public_id: result.public_id,
            size: result.bytes,
            format: result.format,
        });
    } catch (err) {
        res.status(500).json({ error: 'Upload failed', details: err.message });
    }
};

module.exports = { upload, uploadFile };
