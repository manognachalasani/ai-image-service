const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const sharp = require('sharp');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database setup
const db = new sqlite3.Database('./images.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    upload_date TEXT,
    objects_detected TEXT,
    text_extracted TEXT,
    faces_detected TEXT,
    image_path TEXT
  )`);
});

// Enhanced smart mock AI analysis
const analyzeImageWithMockAI = async (imagePath, originalFilename) => {
  // Extract clues from filename
  const filename = originalFilename.toLowerCase();
  
  // Smart scenario detection based on filename clues
  let detectedScenario = 'general';
  let confidence = 0.85;

  if (filename.includes('portrait') || filename.includes('face') || filename.includes('selfie') || filename.includes('person')) {
    detectedScenario = 'portrait';
    confidence = 0.92;
  } else if (filename.includes('landscape') || filename.includes('nature') || filename.includes('mountain') || filename.includes('beach')) {
    detectedScenario = 'landscape';
    confidence = 0.88;
  } else if (filename.includes('street') || filename.includes('city') || filename.includes('urban') || filename.includes('car')) {
    detectedScenario = 'street';
    confidence = 0.87;
  } else if (filename.includes('document') || filename.includes('doc') || filename.includes('text') || filename.includes('page')) {
    detectedScenario = 'document';
    confidence = 0.90;
  } else if (filename.includes('food') || filename.includes('meal') || filename.includes('restaurant')) {
    detectedScenario = 'food';
    confidence = 0.86;
  } else if (filename.includes('animal') || filename.includes('pet') || filename.includes('cat') || filename.includes('dog')) {
    detectedScenario = 'animal';
    confidence = 0.89;
  }

  // Enhanced scenarios with more realistic data
  const scenarios = {
    portrait: {
      objects: ['Person', 'Face', 'Skin', 'Hair', 'Eyes', 'Clothing', 'Background', 'Human'],
      text: [],
      faces: [{ 
        age: `${20 + Math.floor(Math.random() * 20)}-${25 + Math.floor(Math.random() * 20)}`, 
        gender: Math.random() > 0.5 ? 'Female' : 'Male', 
        emotions: ['Happy', 'Neutral', 'Calm', 'Confident'][Math.floor(Math.random() * 4)],
        smile: Math.random() > 0.7 ? 'Smiling' : 'Neutral',
        glasses: Math.random() > 0.8 ? 'Wearing Glasses' : 'No Glasses'
      }],
      scene: 'Indoor Portrait',
      lighting: ['Natural Light', 'Studio Lighting', 'Soft Light'][Math.floor(Math.random() * 3)],
      quality: ['High Quality', 'Good Lighting', 'Clear Focus'][Math.floor(Math.random() * 3)]
    },
    landscape: {
      objects: ['Sky', 'Clouds', 'Trees', 'Mountains', 'Water', 'Horizon', 'Vegetation', 'Natural Scene'],
      text: [],
      faces: [],
      scene: 'Outdoor Landscape',
      lighting: ['Natural Daylight', 'Golden Hour', 'Overcast'][Math.floor(Math.random() * 3)],
      quality: ['Scenic View', 'Good Composition', 'Natural Colors'][Math.floor(Math.random() * 3)],
      environment: ['Peaceful', 'Serene', 'Expansive'][Math.floor(Math.random() * 3)]
    },
    street: {
      objects: ['Building', 'Road', 'Vehicle', 'Person', 'Traffic Light', 'Street Sign', 'Urban Infrastructure', 'Architecture'],
      text: ['STOP', 'OPEN', 'CAFE', 'RESTAURANT', 'PARKING', 'EXIT', 'ENTER'].slice(0, 2 + Math.floor(Math.random() * 3)),
      faces: Math.random() > 0.6 ? [{ 
        age: `${25 + Math.floor(Math.random() * 30)}-${35 + Math.floor(Math.random() * 25)}`, 
        gender: Math.random() > 0.5 ? 'Female' : 'Male', 
        emotions: ['Neutral', 'Focused', 'Walking'][Math.floor(Math.random() * 3)]
      }] : [],
      scene: 'Urban Street',
      lighting: ['Daylight', 'Urban Lighting', 'Mixed Lighting'][Math.floor(Math.random() * 3)],
      activity: ['Busy Street', 'Moderate Traffic', 'Urban Life'][Math.floor(Math.random() * 3)]
    },
    document: {
      objects: ['Paper', 'Text', 'Document', 'Page', 'Writing', 'Background'],
      text: [
        'Important Document - Confidential',
        'Sample Text for Demonstration',
        'AI Image Recognition System',
        'Project Documentation and Analysis',
        'Technical Specifications and Requirements'
      ].slice(0, 2 + Math.floor(Math.random() * 2)),
      faces: [],
      scene: 'Document/Text',
      quality: ['Clear Text', 'Good Contrast', 'Readable Content'][Math.floor(Math.random() * 3)],
      type: ['Formal Document', 'Technical Paper', 'Business Document'][Math.floor(Math.random() * 3)]
    },
    food: {
      objects: ['Food', 'Plate', 'Utensils', 'Table', 'Background', 'Garnish', 'Meal'],
      text: ['RESTAURANT', 'CAFE', 'MENU', 'SPECIAL'].slice(0, 1 + Math.floor(Math.random() * 2)),
      faces: [],
      scene: 'Food Photography',
      lighting: ['Restaurant Lighting', 'Natural Food Light', 'Appetizing Lighting'][Math.floor(Math.random() * 3)],
      appeal: ['Appetizing', 'Well Presented', 'Fresh Ingredients'][Math.floor(Math.random() * 3)]
    },
    animal: {
      objects: ['Animal', 'Fur', 'Eyes', 'Background', 'Pet', 'Nature'],
      text: [],
      faces: [{ 
        species: Math.random() > 0.5 ? 'Cat' : 'Dog',
        pose: ['Sitting', 'Standing', 'Resting'][Math.floor(Math.random() * 3)],
        expression: ['Alert', 'Calm', 'Curious'][Math.floor(Math.random() * 3)]
      }],
      scene: 'Animal Portrait',
      setting: ['Indoor', 'Outdoor', 'Home Environment'][Math.floor(Math.random() * 3)]
    },
    general: {
      objects: ['Object', 'Background', 'Scene', 'Environment', 'Subject'],
      text: Math.random() > 0.7 ? ['Sample Text', 'General Content'] : [],
      faces: Math.random() > 0.5 ? [{ 
        age: `${18 + Math.floor(Math.random() * 40)}-${25 + Math.floor(Math.random() * 40)}`, 
        gender: Math.random() > 0.5 ? 'Female' : 'Male', 
        emotions: ['Neutral', 'Calm'][Math.floor(Math.random() * 2)]
      }] : [],
      scene: 'General Image',
      analysis: ['Standard Quality', 'Clear Image', 'Good Composition'][Math.floor(Math.random() * 3)]
    }
  };

  const analysis = scenarios[detectedScenario];
  
  // Add some random variation to objects
  const extraObjects = {
    portrait: ['Jewelry', 'Accessories', 'Makeup'],
    landscape: ['Sunlight', 'Shadows', 'Reflections'],
    street: ['Pedestrian', 'Shop', 'Window'],
    document: ['Header', 'Footer', 'Logo'],
    food: ['Beverage', 'Condiments', 'Napkin'],
    animal: ['Collar', 'Leash', 'Toys'],
    general: ['Light Source', 'Color', 'Texture']
  };

  if (extraObjects[detectedScenario] && Math.random() > 0.5) {
    analysis.objects.push(extraObjects[detectedScenario][Math.floor(Math.random() * extraObjects[detectedScenario].length)]);
  }

  return {
    ...analysis,
    analysisType: detectedScenario,
    confidence: confidence.toFixed(2),
    processingTime: (100 + Math.random() * 200).toFixed(0),
    imageQuality: ['Excellent', 'Good', 'Average'][Math.floor(Math.random() * 3)],
    timestamp: new Date().toISOString()
  };
};

// File upload configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload and analyze endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Processing image:', req.file.filename);

    // Generate thumbnail
    await sharp(req.file.path)
      .resize(200, 200)
      .jpeg({ quality: 80 })
      .toFile(`uploads/thumb-${req.file.filename}`);

    // Perform AI analysis
    const analysis = await analyzeImageWithMockAI(req.file.path, req.file.originalname);

    // Store in database
    db.run(
      `INSERT INTO images (filename, upload_date, objects_detected, text_extracted, faces_detected, image_path) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.file.originalname,
        new Date().toISOString(),
        JSON.stringify(analysis.objects),
        JSON.stringify(analysis.text),
        JSON.stringify(analysis.faces),
        req.file.filename
      ],
      function(err) {
        if (err) {
          console.error('Database error:', err);
        }
      }
    );

    res.json({
      success: true,
      analysis: analysis,
      imageInfo: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        thumbnail: `/uploads/thumb-${req.file.filename}`,
        fullImage: `/uploads/${req.file.filename}`
      },
      analysisId: Date.now()
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Processing failed: ' + error.message 
    });
  }
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const query = req.query.q.toLowerCase();
  
  db.all(
    `SELECT * FROM images WHERE 
     objects_detected LIKE ? OR text_extracted LIKE ?`,
    [`%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Search failed' });
      }
      
      const results = rows.map(row => ({
        id: row.id,
        filename: row.filename,
        objects: JSON.parse(row.objects_detected),
        text: JSON.parse(row.text_extracted),
        faces: JSON.parse(row.faces_detected),
        uploadDate: row.upload_date,
        imagePath: row.image_path
      })).filter(item => 
        item.objects.some(obj => obj.toLowerCase().includes(query)) ||
        item.text.some(txt => txt.toLowerCase().includes(query))
      );

      res.json({
        query: query,
        results: results,
        count: results.length
      });
    }
  );
});

// Get all images
app.get('/api/images', (req, res) => {
  db.all('SELECT * FROM images ORDER BY upload_date DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const images = rows.map(row => ({
      id: row.id,
      filename: row.filename,
      objects: JSON.parse(row.objects_detected),
      text: JSON.parse(row.text_extracted),
      uploadDate: row.upload_date,
      thumbnail: `/uploads/thumb-${row.image_path}`,
      fullImage: `/uploads/${row.image_path}`
    }));
    
    res.json(images);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Image Service running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ./uploads/`);
  console.log(`💾 Database: ./images.db`);
  console.log(`📊 API Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/analyze`);
  console.log(`   GET  http://localhost:${PORT}/api/search?q=query`);
  console.log(`   GET  http://localhost:${PORT}/api/images`);
});