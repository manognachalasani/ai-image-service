import React from 'react';
import { AnalysisResult, ImageInfo } from '../services/api';
import ExportOptions from './ExportOptions';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  imageInfo: ImageInfo;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, imageInfo }) => {
  // Safe helper functions to handle undefined values
  const safeJoin = (array: any[] | undefined, separator: string = ', '): string => {
    if (!array || !Array.isArray(array)) return 'None';
    return array.join(separator);
  };

  const safeGet = (obj: any, key: string, fallback: string = 'Unknown'): string => {
    return obj && obj[key] ? String(obj[key]) : fallback;
  };

  return (
    <div className="card">
      <h2>🤖 AI Analysis Results</h2>
      
      {/* Add Export Options at the top */}
      <ExportOptions analysis={analysis} imageInfo={imageInfo} />
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginTop: '2rem' }}>
        {/* Image Preview */}
        <div>
          <img 
            src={`http://localhost:5000${imageInfo.thumbnail}`} 
            alt="Analyzed" 
            style={{ width: '200px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <p><strong>File:</strong> {imageInfo.originalName}</p>
            <p><strong>Size:</strong> {(imageInfo.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        {/* Analysis Results */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            {/* Basic Info */}
            <div className="result-item">
              <h4>📊 Basic Information</h4>
              <ul className="result-list">
                <li><strong>Scene:</strong> {analysis.scene || analysis.analysisType || 'General'}</li>
                <li><strong>Confidence:</strong> {(parseFloat(safeGet(analysis, 'confidence', '0.8')) * 100).toFixed(1)}%</li>
                <li><strong>Quality:</strong> {analysis.imageQuality || analysis.quality || 'Good'}</li>
                <li><strong>Processing:</strong> {analysis.processingTime || '150'}ms</li>
              </ul>
            </div>

            {/* Objects Detected */}
            <div className="result-item">
              <h4>🔍 Objects Detected</h4>
              <ul className="result-list">
                {analysis.objects && analysis.objects.length > 0 ? (
                  analysis.objects.map((obj, idx) => (
                    <li key={idx}>• {obj}</li>
                  ))
                ) : (
                  <li>No objects detected</li>
                )}
              </ul>
            </div>
            
            {/* Text Found */}
            {analysis.text && analysis.text.length > 0 && (
              <div className="result-item">
                <h4>📝 Text Found</h4>
                <ul className="result-list">
                  {analysis.text.map((txt, idx) => (
                    <li key={idx}>" {txt} "</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Faces/Subjects */}
            {analysis.faces && analysis.faces.length > 0 && (
              <div className="result-item">
                <h4>👤 Subjects Detected</h4>
                <ul className="result-list">
                  {analysis.faces.map((face, idx) => (
                    <li key={idx}>
                      <div style={{ fontSize: '0.875rem' }}>
                        <strong>Subject {idx + 1}:</strong><br/>
                        • {safeGet(face, 'gender') || safeGet(face, 'species') || 'Person'}<br/>
                        • Age: {safeGet(face, 'age', 'Unknown')}<br/>
                        • Mood: {safeJoin(face.emotions)}<br/>
                        {face.smile && `• ${face.smile}`}<br/>
                        {face.glasses && `• ${face.glasses}`}<br/>
                        {face.pose && `• Pose: ${face.pose}`}<br/>
                        {face.expression && `• Expression: ${face.expression}`}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Analysis */}
            <div className="result-item">
              <h4>🌟 Additional Insights</h4>
              <ul className="result-list">
                {analysis.lighting && <li><strong>Lighting:</strong> {analysis.lighting}</li>}
                {analysis.quality && <li><strong>Quality:</strong> {analysis.quality}</li>}
                {analysis.environment && <li><strong>Environment:</strong> {analysis.environment}</li>}
                {analysis.activity && <li><strong>Activity:</strong> {analysis.activity}</li>}
                {analysis.type && <li><strong>Type:</strong> {analysis.type}</li>}
                {analysis.appeal && <li><strong>Appeal:</strong> {analysis.appeal}</li>}
                {analysis.setting && <li><strong>Setting:</strong> {analysis.setting}</li>}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;