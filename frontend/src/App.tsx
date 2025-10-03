import React, { useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import AnalysisResults from './components/AnalysisResults';
import { AnalysisResult, ImageInfo } from './services/api';

function App() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageInfo | null>(null);

  const handleAnalysisComplete = (analysis: AnalysisResult, imageInfo: ImageInfo) => {
    setCurrentAnalysis(analysis);
    setCurrentImage(imageInfo);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <span>🤖</span>
          AI Image Recognition
        </div>
        <nav className="nav-tabs">
          <button className="nav-button active">Analyze</button>
          <button className="nav-button">Gallery</button>
        </nav>
      </header>

      <main className="main-content">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search analyzed images..."
            className="search-input"
          />
        </div>

        <div className="upload-section">
          <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
          
          {currentAnalysis && currentImage ? (
            <AnalysisResults analysis={currentAnalysis} imageInfo={currentImage} />
          ) : (
            <div className="card">
              <h2>Analysis Results</h2>
              <p>Upload an image to see AI analysis results here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;