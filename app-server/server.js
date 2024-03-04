const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const app = express();
const port = 3001;

app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.post('/upload', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
  try {
    const imageUrl = req.files['image'][0].path;
    const videoUrl = req.files['video'][0].path;

    res.json({ imageUrl, videoUrl });
  } catch (err) {
    console.error('Error processing files:', err);
    res.status(500).json({ error: 'Error processing files' });
  }
});

app.post('/overlay', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const imageUrl = req.files['image'][0].path;
    const videoUrl = req.files['video'][0].path;
    let { x, y, width, height } = req.body;

    const resizedImagePath = `uploads/resized_${Date.now()}.jpeg`;
    await sharp(imageUrl)
      .resize(parseInt(width, 10), parseInt(height, 10))
      .toFile(resizedImagePath);

    const outputVideoPath = `uploads/output_${Date.now()}.mp4`;

    const command = ffmpeg()
      .input(videoUrl)
      .input(resizedImagePath)
      .complexFilter([
        `overlay=${x}:${y}`,
      ])
      .output(outputVideoPath)
      .on('error', (err) => {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error overlaying image on video' });
      })
      .on('end', () => {
        console.log('File saved.');
        res.json({ overlayedVideoUrl: outputVideoPath });
      })
      .run();
  } catch (err) {
    console.error('Error overlaying image on video:', err);
    res.status(500).json({ error: 'Error overlaying image on video' });
  }
});


app.get('/download', (req, res) => {
  try {
    const videoUrl = req.query.videoUrl;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing videoUrl parameter' });
    }

    const fileStream = fs.createReadStream(videoUrl);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ error: 'Error streaming file' });
    });

    fileStream.on('end', () => {
      console.log('File streamed successfully.');
    });
  } catch (error) {
    console.error('Error handling download request:', error);
    res.status(500).json({ error: 'Error handling download request' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on ${port}...`);
});
