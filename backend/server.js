const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const { createCanvas, loadImage } = require('canvas');
require('dotenv').config();

const app = express();
const PORT = 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_2024", (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// database Setup
const db = new sqlite3.Database('./images.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      upload_date TEXT,
      objects_detected TEXT,
      text_extracted TEXT,
      faces_detected TEXT,
      image_path TEXT,
      user_id INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS user_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      analysis_data TEXT,
      image_info TEXT,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY,
      preferences TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  ];

  tables.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) console.error('Table creation error:', err.message);
    });
  });
}

const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');

// azure Configuration
const azureConfig = {
  key: process.env.AZURE_VISION_KEY,
  endpoint: process.env.AZURE_VISION_ENDPOINT
};

// Initialize Azure Client
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': azureConfig.key } }),
  azureConfig.endpoint
);

// checking if azure is configured
const isAzureConfigured = azureConfig.key && azureConfig.endpoint && 
                         azureConfig.key !== 'your-azure-key-here' && 
                         azureConfig.endpoint !== 'your-azure-endpoint-here';

console.log('Azure Configuration Status:', isAzureConfigured ? 'Configured' : 'Not Configured');

// Azure Analysis Function
const analyzeImageWithAzure = async (imagePath) => {
  try {
    console.log('🔍 Analyzing image with Azure Computer Vision...');
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Perform analysis with the buffer
    const analysis = await computerVisionClient.analyzeImageInStream(imageBuffer, {
      visualFeatures: [
        'Categories',
        'Tags',
        'Description',
        'Faces',
        'Color',
        'ImageType',
        'Objects',
        'Brands'
      ],
      language: 'en'
    });

    console.log('Azure analysis completed');
    return formatAzureAnalysis(analysis);
    
  } catch (error) {
    console.error('Azure analysis failed:', error.message);
  }
};

// Format Azure response to match existing structure
const formatAzureAnalysis = (azureResult) => {
  const analysis = {
    objects: azureResult.objects?.map(obj => obj.object) || [],
    text: azureResult.description?.captions?.map(cap => cap.text) || [],
    faces: azureResult.faces?.map(face => ({
      age: `${face.age}`,
      gender: face.gender.charAt(0).toUpperCase() + face.gender.slice(1),
    })) || [],
    analysisType: getAnalysisTypeFromAzure(azureResult),
    confidence: azureResult.description?.captions?.[0]?.confidence?.toFixed(2) || '0.85',
    processingTime: 'Real AI',
    timestamp: new Date().toISOString(),
    // Additional Azure-specific data
    categories: azureResult.categories?.map(cat => ({
      name: cat.name,
      score: cat.score.toFixed(2)
    })) || [],
    tags: azureResult.tags?.map(tag => ({
      name: tag.name,
      confidence: tag.confidence.toFixed(2)
    })) || [],
    colors: azureResult.color || {},
    imageType: azureResult.imageType || {},
    brands: azureResult.brands?.map(brand => brand.name) || []
  };

  return analysis;
};

const getAnalysisTypeFromAzure = (azureResult) => {
  const categories = azureResult.categories?.map(cat => cat.name) || [];
  const tags = azureResult.tags?.map(tag => tag.name) || [];
  
  if (categories.some(cat => cat.includes('people_'))) return 'portrait';
  if (tags.some(tag => ['mountain', 'sky', 'nature', 'outdoor'].includes(tag))) return 'landscape';
  if (tags.some(tag => ['building', 'city', 'urban'].includes(tag))) return 'urban';
  if (tags.some(tag => ['food', 'meal'].includes(tag))) return 'food';
  if (tags.some(tag => ['animal', 'pet', 'cat', 'dog'].includes(tag))) return 'animal';
  if (tags.some(tag => ['text', 'document'].includes(tag))) return 'document';
  
  return 'general';
};

// File Upload Configuration
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
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files allowed!'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Core Analysis Endpoint with Auto-Save
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_2024");
        userId = user.userId;
      } catch (err) {}
    }

    // Generate thumbnail
    await sharp(req.file.path)
      .resize(200, 200)
      .jpeg({ quality: 80 })
      .toFile(`uploads/thumb-${req.file.filename}`);

      const analysis = await analyzeImageWithAzure(req.file.path);

    // Store in main images table
    db.run(
      `INSERT INTO images (filename, upload_date, objects_detected, text_extracted, faces_detected, image_path, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.file.originalname, new Date().toISOString(), JSON.stringify(analysis.objects), 
       JSON.stringify(analysis.text), JSON.stringify(analysis.faces), req.file.filename, userId]
    );

    // Auto-save for registered users
    if (userId) {
      autoSaveAnalysis(userId, analysis, {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        thumbnail: `/uploads/thumb-${req.file.filename}`,
        fullImage: `/uploads/${req.file.filename}`
      })
      .then(saveResult => {
        console.log('Auto-save result:', saveResult);
      })
      .catch(saveError => {
        console.error('Auto-save failed:', saveError);
        // Don't fail the main request if auto-save fails
      });
}

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
      autoSaved: !!userId
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Processing failed' });
  }
});


// Enhanced auto-save with duplicate prevention and better error handling
const autoSaveAnalysis = (userId, analysis, imageInfo) => {
  return new Promise((resolve, reject) => {
    // Check for recent duplicate analysis to prevent spam
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    db.get(
      `SELECT id FROM user_analyses 
       WHERE user_id = ? AND image_info LIKE ? AND saved_at > ? 
       LIMIT 1`,
      [userId, `%${imageInfo.storedName}%`, fiveMinutesAgo],
      (err, existing) => {
        if (err) return reject(err);
        
        if (existing) {
          console.log('Duplicate analysis detected, skipping auto-save');
          return resolve({ skipped: true, reason: 'duplicate' });
        }

        // Proceed with saving
        db.run(
          `INSERT INTO user_analyses (user_id, analysis_data, image_info, saved_at) 
           VALUES (?, ?, ?, ?)`,
          [userId, JSON.stringify(analysis), JSON.stringify(imageInfo), new Date().toISOString()],
          function(err) {
            if (err) return reject(err);
            resolve({ success: true, savedId: this.lastID });
          }
        );
      }
    );
  });
};


// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (user) return res.status(400).json({ error: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], function(err) {
        if (err) return res.status(500).json({ error: 'Error creating user' });

        const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET || "fallback_secret_key_2024", { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: this.lastID, username, email } });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
  });
});

// User Features
app.post('/api/user/save-analysis', authenticateToken, (req, res) => {
  const { analysisData, imageInfo } = req.body;
  
  db.run(
    `INSERT INTO user_analyses (user_id, analysis_data, image_info, saved_at) VALUES (?, ?, ?, ?)`,
    [req.user.userId, JSON.stringify(analysisData), JSON.stringify(imageInfo), new Date().toISOString()],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to save analysis' });
      res.json({ success: true, savedId: this.lastID });
    }
  );
});

// Enhanced history endpoint with search and filtering
app.get('/api/user/history', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const analysisType = req.query.type || '';

  let query = `SELECT * FROM user_analyses WHERE user_id = ?`;
  let params = [req.user.userId];
  let countQuery = `SELECT COUNT(*) as total FROM user_analyses WHERE user_id = ?`;
  let countParams = [req.user.userId];

  // Add search filter
  if (search) {
    query += ` AND (analysis_data LIKE ? OR image_info LIKE ?)`;
    countQuery += ` AND (analysis_data LIKE ? OR image_info LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm);
  }

  // Add analysis type filter
  if (analysisType) {
    query += ` AND analysis_data LIKE ?`;
    countQuery += ` AND analysis_data LIKE ?`;
    const typeTerm = `%"analysisType":"${analysisType}"%`;
    params.push(typeTerm);
    countParams.push(typeTerm);
  }

  query += ` ORDER BY saved_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('History fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }

    const history = rows.map(row => {
      try {
        const analysis = JSON.parse(row.analysis_data);
        const imageInfo = JSON.parse(row.image_info);
        
        return {
          id: row.id,
          analysis: analysis,
          imageInfo: imageInfo,
          savedAt: row.saved_at,
          formattedDate: new Date(row.saved_at).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
          }),
          // Add quick access fields for frontend
          quickInfo: {
            analysisType: analysis.analysisType,
            objectCount: analysis.objects?.length || 0,
            textCount: analysis.text?.length || 0,
            faceCount: analysis.faces?.length || 0
          }
        };
      } catch (parseError) {
        console.error('Error parsing analysis data:', parseError);
        return null;
      }
    }).filter(item => item !== null);

    // Get total count for pagination
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Count error:', err);
        return res.status(500).json({ error: 'Failed to get count' });
      }

      res.json({ 
        history, 
        pagination: { 
          page, 
          limit, 
          total: countResult.total, 
          totalPages: Math.ceil(countResult.total / limit) 
        } 
      });
    });
  });
});

// Delete multiple analyses
app.delete('/api/user/history/bulk', authenticateToken, (req, res) => {
  const { analysisIds } = req.body;
  
  if (!analysisIds || !Array.isArray(analysisIds) || analysisIds.length === 0) {
    return res.status(400).json({ error: 'Analysis IDs array required' });
  }

  // Security: Ensure user can only delete their own analyses
  const placeholders = analysisIds.map(() => '?').join(',');
  const query = `DELETE FROM user_analyses WHERE user_id = ? AND id IN (${placeholders})`;
  const params = [req.user.userId, ...analysisIds];

  db.run(query, params, function(err) {
    if (err) {
      console.error('Bulk delete error:', err);
      return res.status(500).json({ error: 'Failed to delete analyses' });
    }
    
    res.json({ 
      success: true, 
      deletedCount: this.changes,
      message: `Successfully deleted ${this.changes} analyses` 
    });
  });
});

// Export multiple analyses
app.post('/api/user/history/export', authenticateToken, (req, res) => {
  const { analysisIds, format = 'json' } = req.body;
  
  if (!analysisIds || !Array.isArray(analysisIds)) {
    return res.status(400).json({ error: 'Analysis IDs array required' });
  }

  const placeholders = analysisIds.map(() => '?').join(',');
  const query = `SELECT * FROM user_analyses WHERE user_id = ? AND id IN (${placeholders}) ORDER BY saved_at DESC`;
  const params = [req.user.userId, ...analysisIds];

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Export fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch analyses for export' });
    }

    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        source: 'AI Image Recognition Service',
        totalAnalyses: rows.length,
        exportFormat: format
      },
      analyses: rows.map(row => ({
        id: row.id,
        savedAt: row.saved_at,
        analysis: JSON.parse(row.analysis_data),
        imageInfo: JSON.parse(row.image_info)
      }))
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ai-analyses-bulk-${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  });
});

// Get user statistics
app.get('/api/user/statistics', authenticateToken, (req, res) => {
  const queries = {
    totalAnalyses: `SELECT COUNT(*) as count FROM user_analyses WHERE user_id = ?`,
    analysesByType: `SELECT analysis_data FROM user_analyses WHERE user_id = ?`,
    recentActivity: `SELECT COUNT(*) as count FROM user_analyses WHERE user_id = ? AND saved_at > ?`
  };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  db.get(queries.totalAnalyses, [req.user.userId], (err, totalResult) => {
    if (err) return res.status(500).json({ error: 'Failed to get statistics' });

    db.get(queries.recentActivity, [req.user.userId, sevenDaysAgo], (err, recentResult) => {
      if (err) return res.status(500).json({ error: 'Failed to get statistics' });

      db.all(queries.analysesByType, [req.user.userId], (err, typeRows) => {
        if (err) return res.status(500).json({ error: 'Failed to get statistics' });

        const typeCounts = {};
        typeRows.forEach(row => {
          try {
            const analysis = JSON.parse(row.analysis_data);
            const type = analysis.analysisType || 'general';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          } catch (e) {
            // Skip invalid entries
          }
        });

        res.json({
          totalAnalyses: totalResult.count,
          recentActivity: recentResult.count,
          analysesByType: typeCounts,
          averagePerWeek: Math.round((recentResult.count / 7) * 10) / 10
        });
      });
    });
  });
});

app.post('/api/user/preferences', authenticateToken, (req, res) => {
  const { preferences } = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO user_preferences (user_id, preferences) VALUES (?, ?)`,
    [req.user.userId, JSON.stringify(preferences)],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to save preferences' });
      res.json({ success: true });
    }
  );
});

// Search
app.get('/api/search', (req, res) => {
  const query = req.query.q.toLowerCase();
  
  db.all(
    `SELECT * FROM images WHERE objects_detected LIKE ? OR text_extracted LIKE ?`,
    [`%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Search failed' });
      
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

      res.json({ query, results, count: results.length });
    }
  );
});

// Get all images
app.get('/api/images', (req, res) => {
  db.all('SELECT * FROM images ORDER BY upload_date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
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

// Export Endpoints
app.get('/api/export/pdf', (req, res) => {
  try {
    const { analysisData, imageInfo } = req.query;
    if (!analysisData || !imageInfo) return res.status(400).json({ error: 'Analysis data and image info required' });

    const analysis = JSON.parse(analysisData);
    const image = JSON.parse(imageInfo);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ai-analysis-${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('AI Image Analysis Report', 100, 100);
    doc.moveDown();
    
    doc.fontSize(14).font('Helvetica-Bold').text('Basic Information:');
    doc.font('Helvetica').fontSize(12);
    doc.text(`File Name: ${image.originalName}`);
    doc.text(`File Size: ${(image.size / 1024 / 1024).toFixed(2)} MB`);
    doc.text(`Analysis Type: ${analysis.analysisType}`);
    doc.text(`Confidence: ${(parseFloat(analysis.confidence) * 100).toFixed(1)}%`);
    doc.moveDown();

    if (analysis.objects.length > 0) {
      doc.font('Helvetica-Bold').text('Objects Detected:');
      doc.font('Helvetica');
      analysis.objects.forEach(obj => doc.text(`• ${obj}`));
      doc.moveDown();
    }

    if (analysis.text.length > 0) {
      doc.font('Helvetica-Bold').text('Text Found:');
      doc.font('Helvetica');
      analysis.text.forEach(txt => doc.text(`• "${txt}"`));
      doc.moveDown();
    }

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

    const additionalFields = ['lighting', 'quality', 'environment', 'activity', 'type', 'appeal', 'setting'];
    const hasAdditional = additionalFields.some(field => analysis[field]);
    
    if (hasAdditional) {
      doc.font('Helvetica-Bold').text('Additional Insights:');
      doc.font('Helvetica');
      additionalFields.forEach(field => {
        if (analysis[field]) doc.text(`• ${field.charAt(0).toUpperCase() + field.slice(1)}: ${analysis[field]}`);
      });
    }

    doc.fontSize(10).text(`Generated by AI Image Recognition Service on ${new Date().toLocaleString()}`, 100, doc.page.height - 100);
    doc.end();

  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/api/export/json', (req, res) => {
  try {
    const { analysisData, imageInfo } = req.query;
    if (!analysisData || !imageInfo) return res.status(400).json({ error: 'Analysis data and image info required' });

    const exportData = {
      exportInfo: { exportedAt: new Date().toISOString(), version: '1.0', source: 'AI Image Recognition Service' },
      imageInfo: JSON.parse(imageInfo),
      analysis: JSON.parse(analysisData)
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ai-analysis-${Date.now()}.json"`);
    res.json(exportData);

  } catch (error) {
    res.status(500).json({ error: 'Failed to generate JSON' });
  }
});

app.get('/api/export/csv', (req, res) => {
  try {
    const { analysisData, imageInfo } = req.query;
    if (!analysisData || !imageInfo) return res.status(400).json({ error: 'Analysis data and image info required' });

    const analysis = JSON.parse(analysisData);
    const image = JSON.parse(imageInfo);

    let csvContent = 'AI Image Analysis Export\n\n';
    csvContent += 'Basic Information:\n';
    csvContent += `File Name,${image.originalName}\n`;
    csvContent += `File Size (MB),${(image.size / 1024 / 1024).toFixed(2)}\n`;
    csvContent += `Analysis Type,${analysis.analysisType}\n`;
    csvContent += `Confidence,${(parseFloat(analysis.confidence) * 100).toFixed(1)}%\n\n`;
    
    csvContent += 'Objects Detected:\n';
    analysis.objects.forEach(obj => csvContent += `${obj}\n`);
    csvContent += '\n';
    
    if (analysis.text.length > 0) {
      csvContent += 'Text Found:\n';
      analysis.text.forEach(txt => csvContent += `"${txt}"\n`);
      csvContent += '\n';
    }
    
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
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ai-analysis-${Date.now()}.csv"`);
    res.send(csvContent);

  } catch (error) {
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`AI Image Service running on http://localhost:${PORT}`);
});