const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database setup
const db = new sqlite3.Database('./images.db', (err) => {
  if (err) {
    console.error('💥 Error connecting to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    
    // Initialize tables after connection is established
    initializeDatabase();
  }
});

// Function to initialize database tables
function initializeDatabase() {
  console.log('🔄 Initializing database tables...');
  
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('💥 Error creating users table:', err.message);
    } else {
      console.log('✅ Users table ready');
    }
  });

  // Create images table
  db.run(`CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    upload_date TEXT,
    objects_detected TEXT,
    text_extracted TEXT,
    faces_detected TEXT,
    image_path TEXT,
    user_id INTEGER
  )`, (err) => {
    if (err) {
      console.error('💥 Error creating images table:', err.message);
    } else {
      console.log('✅ Images table ready');
    }
  });

  // Create user_analyses table
  db.run(`CREATE TABLE IF NOT EXISTS user_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    analysis_data TEXT,
    image_info TEXT,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('💥 Error creating user_analyses table:', err.message);
    } else {
      console.log('✅ User analyses table ready');
    }
  });

  // Create user_preferences table
  db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INTEGER PRIMARY KEY,
    preferences TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('💥 Error creating user_preferences table:', err.message);
    } else {
      console.log('✅ User preferences table ready');
    }
  });
}

// Add a simple test endpoint to check database status
app.get('/api/db-status', (req, res) => {
  db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json({ 
      status: 'Database connected',
      tables: row ? 'Tables exist' : 'No tables found'
    });
  });
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

// === AUTH MIDDLEWARE===
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// === AUTH ROUTES ===

// Register endpoint
// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('🔐 Register attempt:', { username, email });

    // Validation
    if (!username || !email || !password) {
      console.log('❌ Validation failed: Missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    console.log('🔍 Checking if user exists...');
    
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
      if (err) {
        console.error('💥 Database SELECT error:', err);
        return res.status(500).json({ error: 'Database error - cannot check existing users' });
      }
      
      if (user) {
        console.log('❌ User already exists:', user);
        return res.status(400).json({ error: 'User already exists' });
      }

      console.log('✅ No existing user found, creating new user...');

      try {
        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('🔑 Password hashed successfully');
        
        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
          [username, email, hashedPassword], 
          function(err) {
            if (err) {
              console.error('💥 Database INSERT error:', err);
              return res.status(500).json({ error: 'Error creating user in database' });
            }

            console.log('✅ User created successfully with ID:', this.lastID);

            // Generate JWT token
            const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
            
            res.json({
              success: true,
              message: 'User created successfully',
              token,
              user: { id: this.lastID, username, email }
            });
            
            console.log('🎉 Registration completed successfully');
          }
        );
      } catch (hashError) {
        console.error('💥 Password hashing error:', hashError);
        return res.status(500).json({ error: 'Server error during registration' });
      }
    });

  } catch (error) {
    console.error('💥 General registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('💥 Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check password using bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// === USER-SPECIFIC FEATURES (Require Authentication) ===

// Save analysis to user's history
app.post('/api/user/save-analysis', authenticateToken, (req, res) => {
  const { analysisData, imageInfo } = req.body;
  
  db.run(
    `INSERT INTO user_analyses (user_id, analysis_data, image_info, saved_at) 
     VALUES (?, ?, ?, ?)`,
    [req.user.userId, JSON.stringify(analysisData), JSON.stringify(imageInfo), new Date().toISOString()],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save analysis' });
      }
      res.json({ success: true, savedId: this.lastID });
    }
  );
});

// Get user's analysis history (only for registered users)
app.get('/api/user/history', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM user_analyses WHERE user_id = ? ORDER BY saved_at DESC',
    [req.user.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch history' });
      }
      
      const history = rows.map(row => ({
        id: row.id,
        analysis: JSON.parse(row.analysis_data),
        imageInfo: JSON.parse(row.image_info),
        savedAt: row.saved_at
      }));
      
      res.json(history);
    }
  );
});

// Save search preferences
app.post('/api/user/preferences', authenticateToken, (req, res) => {
  const { preferences } = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO user_preferences (user_id, preferences) 
     VALUES (?, ?)`,
    [req.user.userId, JSON.stringify(preferences)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save preferences' });
      }
      res.json({ success: true });
    }
  );
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

const PDFDocument = require('pdfkit');

// PDF Export endpoint
app.get('/api/export/pdf', (req, res) => {
  try {
    const { analysisData, imageInfo } = req.query;
    
    if (!analysisData || !imageInfo) {
      return res.status(400).json({ error: 'Analysis data and image info required' });
    }

    const analysis = JSON.parse(analysisData);
    const image = JSON.parse(imageInfo);

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ai-analysis-${Date.now()}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // PDF Content
    doc.fontSize(20).font('Helvetica-Bold').text('AI Image Analysis Report', 100, 100);
    doc.moveDown();
    
    // Basic Information
    doc.fontSize(14).font('Helvetica-Bold').text('Basic Information:');
    doc.font('Helvetica').fontSize(12);
    doc.text(`File Name: ${image.originalName}`);
    doc.text(`File Size: ${(image.size / 1024 / 1024).toFixed(2)} MB`);
    doc.text(`Analysis Type: ${analysis.analysisType}`);
    doc.text(`Confidence: ${(parseFloat(analysis.confidence) * 100).toFixed(1)}%`);
    doc.moveDown();

    // Objects Detected
    if (analysis.objects.length > 0) {
      doc.font('Helvetica-Bold').text('Objects Detected:');
      doc.font('Helvetica');
      analysis.objects.forEach(obj => {
        doc.text(`• ${obj}`);
      });
      doc.moveDown();
    }

    // Text Found
    if (analysis.text.length > 0) {
      doc.font('Helvetica-Bold').text('Text Found:');
      doc.font('Helvetica');
      analysis.text.forEach(txt => {
        doc.text(`• "${txt}"`);
      });
      doc.moveDown();
    }

    // Faces Detected
    if (analysis.faces.length > 0) {
      doc.font('Helvetica-Bold').text('Faces Detected:');
      doc.font('Helvetica');
      analysis.faces.forEach((face, index) => {
        doc.text(`Subject ${index + 1}:`);
        doc.text(`  Gender: ${face.gender || 'Unknown'}`);
        doc.text(`  Age: ${face.age}`);
        doc.text(`  Emotions: ${face.emotions.join(', ')}`);
        if (face.smile) doc.text(`  ${face.smile}`);
        if (face.glasses) doc.text(`  ${face.glasses}`);
      });
      doc.moveDown();
    }

    // Additional Insights
    const additionalFields = ['lighting', 'quality', 'environment', 'activity', 'type', 'appeal', 'setting'];
    const hasAdditional = additionalFields.some(field => analysis[field]);
    
    if (hasAdditional) {
      doc.font('Helvetica-Bold').text('Additional Insights:');
      doc.font('Helvetica');
      additionalFields.forEach(field => {
        if (analysis[field]) {
          doc.text(`• ${field.charAt(0).toUpperCase() + field.slice(1)}: ${analysis[field]}`);
        }
      });
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).text(`Generated by AI Image Recognition Service on ${new Date().toLocaleString()}`, 100, doc.page.height - 100);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// JSON Export endpoint
app.get('/api/export/json', (req, res) => {
  try {
    const { analysisData, imageInfo } = req.query;
    
    if (!analysisData || !imageInfo) {
      return res.status(400).json({ error: 'Analysis data and image info required' });
    }

    const analysis = JSON.parse(analysisData);
    const image = JSON.parse(imageInfo);

    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        source: 'AI Image Recognition Service'
      },
      imageInfo: image,
      analysis: analysis
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ai-analysis-${Date.now()}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({ error: 'Failed to generate JSON export' });
  }
});

// CSV Export endpoint
app.get('/api/export/csv', (req, res) => {
  try {
    const { analysisData, imageInfo } = req.query;
    
    if (!analysisData || !imageInfo) {
      return res.status(400).json({ error: 'Analysis data and image info required' });
    }

    const analysis = JSON.parse(analysisData);
    const image = JSON.parse(imageInfo);

    let csvContent = 'AI Image Analysis Export\n\n';
    
    // Basic Information
    csvContent += 'Basic Information:\n';
    csvContent += `File Name,${image.originalName}\n`;
    csvContent += `File Size (MB),${(image.size / 1024 / 1024).toFixed(2)}\n`;
    csvContent += `Analysis Type,${analysis.analysisType}\n`;
    csvContent += `Confidence,${(parseFloat(analysis.confidence) * 100).toFixed(1)}%\n\n`;
    
    // Objects
    csvContent += 'Objects Detected:\n';
    analysis.objects.forEach(obj => {
      csvContent += `${obj}\n`;
    });
    csvContent += '\n';
    
    // Text
    if (analysis.text.length > 0) {
      csvContent += 'Text Found:\n';
      analysis.text.forEach(txt => {
        csvContent += `"${txt}"\n`;
      });
      csvContent += '\n';
    }
    
    // Faces
    if (analysis.faces.length > 0) {
      csvContent += 'Faces Detected:\n';
      csvContent += 'Subject,Gender,Age,Emotions,Additional\n';
      analysis.faces.forEach((face, index) => {
        const additional = [];
        if (face.smile) additional.push(face.smile);
        if (face.glasses) additional.push(face.glasses);
        if (face.pose) additional.push(`Pose: ${face.pose}`);
        if (face.expression) additional.push(`Expression: ${face.expression}`);
        
        csvContent += `Subject ${index + 1},${face.gender || ''},${face.age},${face.emotions.join('; ')},${additional.join('; ')}\n`;
      });
      csvContent += '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ai-analysis-${Date.now()}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

const { createCanvas, loadImage } = require('canvas');

// Image with Overlays export endpoint
app.get('/api/export/image-overlay', async (req, res) => {
  try {
    const { analysisData, imageInfo } = req.query;
    
    if (!analysisData || !imageInfo) {
      return res.status(400).json({ error: 'Analysis data and image info required' });
    }

    const analysis = JSON.parse(analysisData);
    const image = JSON.parse(imageInfo);

    // Load the original image
    const originalImage = await loadImage(`./uploads/${image.storedName}`);
    
    // Create canvas with same dimensions
    const canvas = createCanvas(originalImage.width, originalImage.height);
    const ctx = canvas.getContext('2d');

    // Draw original image
    ctx.drawImage(originalImage, 0, 0);

    // Set overlay styles
    ctx.strokeStyle = '#ff0000';
    ctx.fillStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 20px Arial';

    // Mock bounding box coordinates (in a real AI, these would come from the analysis)
    const generateMockBoundingBoxes = (objects, imageWidth, imageHeight) => {
      const boxes = [];
      const usedAreas = [];
      
      objects.forEach((object, index) => {
        // Generate random but non-overlapping bounding boxes
        let x, y, width, height;
        let attempts = 0;
        
        do {
          width = Math.min(200 + Math.random() * 150, imageWidth * 0.4);
          height = Math.min(100 + Math.random() * 100, imageHeight * 0.3);
          x = Math.random() * (imageWidth - width);
          y = Math.random() * (imageHeight - height);
          attempts++;
        } while (
          attempts < 50 && 
          usedAreas.some(area => 
            x < area.x + area.width && 
            x + width > area.x && 
            y < area.y + area.height && 
            y + height > area.y
          )
        );

        if (attempts < 50) {
          boxes.push({ object, x, y, width, height });
          usedAreas.push({ x, y, width, height });
        }
      });

      return boxes;
    };

    // Generate bounding boxes for objects
    const boundingBoxes = generateMockBoundingBoxes(
      analysis.objects || [], 
      originalImage.width, 
      originalImage.height
    );

    // Draw bounding boxes and labels
    boundingBoxes.forEach((box, index) => {
      const { object, x, y, width, height } = box;

      // Draw bounding box
      ctx.strokeRect(x, y, width, height);
      
      // Draw label background
      const text = `${object}`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width + 20;
      const textHeight = 30;
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(x, y - textHeight, textWidth, textHeight);
      
      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(text, x + 10, y - 10);
    });

    // Draw text detection areas (if text was found)
    if (analysis.text && analysis.text.length > 0) {
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = '#00ff00';
      
      analysis.text.forEach((text, index) => {
        const x = 50 + (index * 300) % (originalImage.width - 300);
        const y = 100 + Math.floor((index * 300) / originalImage.width) * 100;
        const width = 250;
        const height = 40;

        // Draw text bounding box
        ctx.strokeRect(x, y, width, height);
        
        // Draw text label background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(x, y - 30, width, 30);
        
        // Draw text label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        const displayText = text.length > 20 ? text.substring(0, 20) + '...' : text;
        ctx.fillText('📝 ' + displayText, x + 10, y - 10);
      });
    }

    // Draw face detection areas (if faces were found)
    if (analysis.faces && analysis.faces.length > 0) {
      ctx.strokeStyle = '#0000ff';
      ctx.fillStyle = '#0000ff';
      
      analysis.faces.forEach((face, index) => {
        const x = 100 + (index * 200) % (originalImage.width - 200);
        const y = originalImage.height - 200 - (Math.floor((index * 200) / originalImage.width) * 150);
        const width = 150;
        const height = 150;

        // Draw face bounding box
        ctx.strokeRect(x, y, width, height);
        
        // Draw face info background
        ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
        const infoHeight = 80;
        ctx.fillRect(x, y + height, width, infoHeight);
        
        // Draw face info
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`👤 ${face.gender || 'Person'}`, x + 10, y + height + 20);
        ctx.fillText(`🎂 ${face.age || 'Unknown'}`, x + 10, y + height + 40);
        ctx.fillText(`😊 ${face.emotions?.join(', ') || 'Neutral'}`, x + 10, y + height + 60);
      });
    }

    // Add watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('AI Analysis Overlay', 20, originalImage.height - 20);

    // Send the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="ai-analysis-overlay-${Date.now()}.png"`);
    
    const buffer = canvas.toBuffer('image/png');
    res.send(buffer);

  } catch (error) {
    console.error('Image overlay export error:', error);
    res.status(500).json({ error: 'Failed to generate image overlay' });
  }
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