const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const safeExtension = path.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExtension}`);
    }
});

// Check file type
function checkFileType(file, cb) {
    const extname = /\.(pdf|doc|docx|xls|xlsx|png|jpe?g|gif|txt|csv)$/i.test(file.originalname);
    const mimetype = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet)|application\/vnd\.ms-excel|application\/csv|text\/(plain|csv)|image\/(png|jpe?g|gif))$/i.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only PDF, Word, Excel, images, and text files are allowed!'));
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
