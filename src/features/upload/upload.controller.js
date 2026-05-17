const uploadImage = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'الرجاء اختيار صورة لرفعها' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(201).json({ success: true, imageUrl, message: 'تم رفع الصورة بنجاح' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { uploadImage };
