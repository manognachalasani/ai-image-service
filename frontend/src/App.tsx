import React, { useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import AnalysisResults from './components/AnalysisResults';
import UserProfile from './components/UserProfile';
import { AuthProvider } from './context/AuthContext';
import { AnalysisResult, ImageInfo } from './services/api';
import UserHistory from './components/UserHistory';

function AppContent() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'gallery' | 'history'>('analyze');

  const handleAnalysisComplete = (analysis: AnalysisResult, imageInfo: ImageInfo) => {
    setCurrentAnalysis(analysis);
    setCurrentImage(imageInfo);
    setActiveTab('analyze');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <span>🤖</span>
          AI Image Recognition
        </div>
        <nav className="nav-tabs">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`nav-button ${activeTab === 'analyze' ? 'active' : ''}`}
          >
            Analyze
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          >
            My History
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`nav-button ${activeTab === 'gallery' ? 'active' : ''}`}
          >
            Gallery
          </button>
        </nav>
        <UserProfile />
      </header>

      <main className="main-content">
        {activeTab === 'analyze' && (
          <div className="upload-section">
            <div>
              <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
            </div>
            <div>
              {currentAnalysis && currentImage ? (
                <AnalysisResults 
                  analysis={currentAnalysis} 
                  imageInfo={currentImage}
                />
              ) : (
                <div className="card">
                  <h2>Analysis Results</h2>
                  <p>Upload an image to see AI analysis results here.</p>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '6px' }}>
                    <p style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                      <strong>💡 Tip:</strong> Register to save your analysis history and access premium features!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <UserHistory />
        )}

        {activeTab === 'gallery' && (
          <div className="card">
            <h2>Image Gallery</h2>
            <p>Search and browse analyzed images. (Coming soon for registered users!)</p>
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '6px' }}>
              <p style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                <strong>🔒 Premium Feature:</strong> Register to save your personal image gallery and analysis history!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;