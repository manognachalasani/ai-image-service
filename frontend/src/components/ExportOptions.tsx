import React from 'react';
import { AnalysisResult, ImageInfo } from '../services/api';

interface ExportOptionsProps {
  analysis: AnalysisResult;
  imageInfo: ImageInfo;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ analysis, imageInfo }) => {
  const handleExport = async (format: 'pdf' | 'json' | 'csv') => {
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
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <p><strong>Export Options:</strong> PDF file, JSON file, CSV File</p>
        <p><strong>Available Formats:</strong> Comprehensive reports and data exports for your analysis results</p>
      </div>
    </div>
  );
};

export default ExportOptions;