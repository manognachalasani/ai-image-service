import React from 'react';
import { AnalysisResult, ImageInfo } from '../services/api';

interface ExportOptionsProps {
  analysis: AnalysisResult;
  imageInfo: ImageInfo;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ analysis, imageInfo }) => {
  const handleExport = async (format: 'pdf' | 'json' | 'csv' | 'image-overlay') => {
  try {
    // Ensure analysis data is properly formatted
    const safeAnalysis = {
      ...analysis,
      objects: analysis.objects || [],
      text: analysis.text || [],
      faces: (analysis.faces || []).map(face => ({
        ...face,
        emotions: Array.isArray(face.emotions) ? face.emotions : []
      })),
      confidence: analysis.confidence || '0.8'
    };

    const analysisData = encodeURIComponent(JSON.stringify(safeAnalysis));
    const imageInfoData = encodeURIComponent(JSON.stringify(imageInfo));
    
    const url = `http://localhost:5000/api/export/${format}?analysisData=${analysisData}&imageInfo=${imageInfoData}`;
    
    if (format === 'pdf') {
      window.open(url, '_blank');
    } else if (format === 'image-overlay') {
      // Show preview in new tab with download instructions
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>AI Analysis Overlay Preview</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 800px;
                margin: 0 auto;
              }
              img { 
                max-width: 100%; 
                height: auto;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .download-btn {
                background: #f59e0b;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 10px;
              }
              .download-btn:hover {
                background: #d97706;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🖼️ AI Analysis Overlay Preview</h2>
              <img src="${url}" alt="AI Analysis Overlay" />
              <br>
              <button class="download-btn" onclick="window.location.href='${url}'" download="ai-analysis-overlay-${Date.now()}.png">
                📥 Download Image
              </button>
              <p><em>Note: This is a mock visualization. Real AI would provide accurate bounding boxes.</em></p>
            </div>
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.click();
    }
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please try again.');
  }
};

  return (
    <div className="card">
      <h3>📤 Export Analysis</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          className="primary-button"
          onClick={() => handleExport('pdf')}
          style={{ backgroundColor: '#dc2626' }}
        >
          📄 PDF Report
        </button>
        
        <button 
          className="primary-button"
          onClick={() => handleExport('json')}
          style={{ backgroundColor: '#059669' }}
        >
          📊 JSON Data
        </button>
        
        <button 
          className="primary-button"
          onClick={() => handleExport('csv')}
          style={{ backgroundColor: '#7c3aed' }}
        >
          📈 CSV Spreadsheet
        </button>

        <button 
          className="primary-button"
          onClick={() => handleExport('image-overlay')}
          style={{ backgroundColor: '#f59e0b' }}
        >
          🖼️ Image with Overlays
        </button>
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <p><strong>Export Options:</strong> PDF file, JSON file, CSV File, Image with Overlays</p>
        <p><strong>Image with Overlays:</strong> Visual representation of detected objects, text, and faces</p>
      </div>
    </div>
  );
};

export default ExportOptions;