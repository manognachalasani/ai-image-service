import React, { useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import AnalysisResults from './components/AnalysisResults';
import UserProfile from './components/UserProfile';
import { AuthProvider } from './context/AuthContext';
import { AnalysisResult, ImageInfo } from './services/api';
import UserHistory from './components/UserHistory';
import DiscoverGallery from './components/DiscoverGallery';

function AppContent() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'discover' | 'history'>('analyze');

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
            🧪 Analyze
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          >
            📚 My History
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`nav-button ${activeTab === 'discover' ? 'active' : ''}`}
          >
            🌍 Discover
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
                      <strong>💡 Tip:</strong> Register to save your analysis history now!
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

        {activeTab === 'discover' && (
          <DiscoverGallery />
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