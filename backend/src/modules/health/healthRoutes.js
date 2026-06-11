const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  decodePrescription,
  analyzeLabReport,
  translateHealthContent,
  synthesizeVoice,
  listLearningResources,
  streamTtsAudio
} = require('./healthController');

// Ensure tmp uploads folder exists
const uploadDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only files (images, pdfs) are allowed'));
  }
});

router.post('/prescription/decode', upload.single('file'), decodePrescription);
router.post('/lab/analyze', upload.single('file'), analyzeLabReport);
router.post('/translate', translateHealthContent);
router.post('/voice/tts', synthesizeVoice);
router.get('/voice/tts-stream', streamTtsAudio);
router.get('/learning/resources', listLearningResources);

module.exports = router;
