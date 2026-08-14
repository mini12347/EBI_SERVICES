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
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|txt|csv/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = /application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument|image\/|text\/|application\/csv/.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only PDF, Word, Excel, images, and text files are allowed!'));
    }
}

// Init upload
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
