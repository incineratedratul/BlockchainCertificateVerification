const express = require('express');
const multer = require('multer');
const { create } = require('ipfs-http-client');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Initialize IPFS client
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

// Upload file to IPFS
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const filePath = path.join(process.cwd(), file.path);
    const fileBuffer = fs.readFileSync(filePath);

    const result = await ipfs.add(fileBuffer);
    const cid = result.path;
    res.json({ cid });
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({ error: 'Error uploading to IPFS' });
  }
});

module.exports = router;
