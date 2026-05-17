const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const adminAuth = require('../../core/middleware/auth');
const uploadController = require('./upload.controller');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('يُسمح فقط برفع الصور (jpeg, jpg, png, webp, gif)'));
    }
});

router.post('/', adminAuth, upload.single('image'), uploadController.uploadImage);

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'حجم الصورة كبير جداً. الحد الأقصى هو 5 ميجابايت' });
        }
    }
    res.status(400).json({ message: error.message });
});

module.exports = router;
