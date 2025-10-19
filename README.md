# AI Image Analysis Service

A powerful full-stack web application that leverages Azure Computer Vision AI to analyze images and extract detailed insights including objects, text, faces, tags and metadata.

## Features

### AI-Powered Analysis
- **Object Detection** - Automatically identifies and labels objects within images
- **Text Recognition (OCR)** - Extracts readable text from images and documents
- **Face Detection** - Detects human faces and analyzes facial features
- **Image Tagging** - Generates relevant tags for content classification
- **Color Analysis** - Identifies dominant colors and color schemes

### Easy Management
- **Drag & Drop Upload** - Simple, intuitive image uploading interface
- **Search & Filter** - Find images by filename, detected objects, or extracted text
- **Discover Gallery** - Browse and explore community-analyzed images
- **Multiple Export Formats** - Download analysis results as PDF, JSON, or CSV

### User Experience
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Real-time Processing** - Instant AI analysis with progress indicators
- **Visual Results** - Clean, organized display of analysis findings

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Modern CSS** with responsive grid layouts
- **Axios** for HTTP requests
- **Component-based architecture**

### Backend
- **Node.js** with Express.js
- **Azure Computer Vision API** for AI analysis
- **SQLite** for lightweight data storage
- **Multer** for file upload handling
- **Sharp** for image processing and thumbnail generation
- **CORS** enabled for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Azure Computer Vision API key

### 1. Clone the Repository
```bash
git clone https://github.com/manognachalasani/ai-image-service.git
cd ai-image-service
```

### 2. Backend Setup
```bash
cd backend
npm install
```

#### Environment Configuration
Create a `.env` file in the backend directory:
```env
AZURE_VISION_KEY=your_azure_computer_vision_key
AZURE_VISION_ENDPOINT=your_azure_endpoint_url
PORT=5000
```

#### Start the Backend Server
```bash
node server.js
```
Server runs on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Application runs on `http://localhost:3000`

## 🚀 Usage

### Image Analysis
1. **Upload** images via drag & drop or file selector
2. **Wait** for AI processing (typically 2-5 seconds)
3. **View** detailed analysis including:
   - Detected objects with confidence scores
   - Extracted text content
   - Face detection results
   - Color analysis
   - Relevant tags

### Search & Discovery
- Use the search bar to find images by content
- Filter by analysis type (Portraits, Landscapes, Food, etc.)
- Browse the Discover gallery to see community uploads

### Export Results
- **PDF Report** - Comprehensive analysis document
- **JSON Data** - Raw analysis data for developers
- **CSV Spreadsheet** - Structured data for analysis

## 📁 Project Structure

```
ai-image-service/
├── backend/
│   ├── server.js          # Express server & API routes
│   ├── uploads/           # Image storage
│   ├── thumbnails/        # Generated thumbnails
│   └── database.db        # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service functions
│   │   └── App.tsx        # Main application component
│   └── public/
└── README.md
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Upload and analyze images |
| GET | `/api/search?q=query` | Search analyzed images |
| GET | `/api/export/pdf` | Export analysis as PDF |
| GET | `/api/export/json` | Export analysis as JSON |
| GET | `/api/export/csv` | Export analysis as CSV |

## 🔒 Security Features

- Environment variables for sensitive data
- File type validation on upload
- CORS configuration
- Input sanitization
- Git secret scanning protection

## 🎯 Use Cases

- **Content Moderation** - Automatically detect inappropriate content
- **Digital Asset Management** - Tag and organize image libraries
- **Accessibility** - Generate alt text for images
- **E-commerce** - Automatically categorize product images
- **Research** - Analyze visual data at scale
- **Education** - Teach computer vision concepts

---

**Built with <3 using React, Node.js, and Azure AI**
