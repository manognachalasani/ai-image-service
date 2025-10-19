import React from 'react';
import { AnalysisResult, ImageInfo } from '../services/api';
import ExportOptions from './ExportOptions';
import { useAuth } from '../context/AuthContext';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  imageInfo: ImageInfo;
  autoSaved?: boolean;
  analysisId?: number;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
  analysis, 
  imageInfo, 
  autoSaved = false,
  analysisId 
}) => {
  const { isAuthenticated } = useAuth();

  // handling undefined values
  const safeJoin = (array: any[] | undefined, separator: string = ', '): string => {
    if (!array || !Array.isArray(array)) return 'None';
    return array.join(separator);
  };

  const safeGet = (obj: any, key: string, fallback: string = 'Unknown'): string => {
    return obj && obj[key] ? String(obj[key]) : fallback;
  };

  // analysis quality indicator
  const getQualityColor = (quality: string) => {
    const qualityLower = quality?.toLowerCase() || 'good';
    switch (qualityLower) {
      case 'excellent': return '#10b981';
      case 'good': return '#14acf9ff';
      case 'average': return '#f59e0b';
      case 'high quality': return '#10b981';
      case 'clear focus': return '#10b981';
      case 'standard quality': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h2>Here are the results after AI analyzed your image!</h2>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAuthenticated && autoSaved && (
            <span 
              style={{ 
                background: '#10b964ff', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px', 
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              Auto-saved
            </span>
          )}
          {analysisId && (
            <span 
              style={{ 
                background: '#9a9fe4ff', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px', 
                fontSize: '0.75rem' 
              }}
            >
              ID: {analysisId}
            </span>
          )}
        </div>
      </div>

      <ExportOptions 
        analysis={analysis} 
        imageInfo={imageInfo} 
      />

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginTop: '2rem' }}>
        {/* Image Preview */}
        <div>
          <img 
            src={`http://localhost:5000${imageInfo.thumbnail}`} 
            alt="Analyzed" 
            style={{ 
              width: '200px', 
              height: '200px',
              objectFit: 'cover',
              borderRadius: '8px', 
              border: '2px solid #000000ff' 
            }}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#8e7b99ff' }}>
            <p><strong>File:</strong> {imageInfo.originalName}</p>
            <p><strong>Size:</strong> {(imageInfo.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>
              <strong>Quality:</strong> 
              <span style={{ 
                color: getQualityColor(analysis.imageQuality || analysis.quality || 'Good :)'),
                fontWeight: 'bold',
                marginLeft: '0.25rem'
              }}>
                {analysis.imageQuality || analysis.quality || 'Good :)'}
              </span>
            </p>
          </div>
        </div>

        {/* Analysis Results */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            
            {/* Basic Info */}
            <div className="result-item">
              <h4>Here's the Analysis Overview</h4>
              <ul className="result-list">
                <li>
                  <strong>Type:</strong> 
                  <span style={{ 
                    textTransform: 'capitalize',
                    background: '#e6add5ff',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem'
                  }}>
                    {analysis.analysisType || 'general'}
                  </span>
                </li>
                <li>
                  <strong>Confidence:</strong> 
                  <span style={{ 
                    color: parseFloat(safeGet(analysis, 'confidence', '0.8')) > 0.8 ? '#10b959ff' : '#f59e0b',
                    fontWeight: 'bold',
                    marginLeft: '0.5rem'
                  }}>
                    {(parseFloat(safeGet(analysis, 'confidence', '0.8')) * 100).toFixed(1)}%
                  </span>
                </li>
                <li><strong>Scene:</strong> {analysis.scene || 'General'}</li>
                <li><strong>Processing Time:</strong> {analysis.processingTime || '150'}ms</li>
                {analysis.timestamp && (
                  <li><strong>Analyzed:</strong> {new Date(analysis.timestamp).toLocaleString()}</li>
                )}
              </ul>
            </div>

            {/* Objects Detected */}
            <div className="result-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>Objects</h4>
                <span className="badge">{analysis.objects?.length || 0}</span>
              </div>
              <ul className="result-list">
                {analysis.objects && analysis.objects.length > 0 ? (
                  analysis.objects.map((obj, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        background: '#735cfaff', 
                        borderRadius: '50%' 
                      }}></div>
                      {obj}
                    </li>
                  ))
                ) : (
                  <li style={{ color: '#7aa6f3ff', fontStyle: 'italic' }}>No objects detected</li>
                )}
              </ul>
            </div>
            
            {/* Text Found */}
            <div className="result-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>Text</h4>
                <span className="badge">{analysis.text?.length || 0}</span>
              </div>
              <ul className="result-list">
                {analysis.text && analysis.text.length > 0 ? (
                  analysis.text.map((txt, idx) => (
                    <li key={idx} style={{ 
                      background: '#efbdf9ff', 
                      padding: '0.5rem',
                      borderRadius: '4px',
                      borderLeft: '3px solid #0ea5e9',
                      marginBottom: '0.25rem'
                    }}>
                      "{txt}"
                    </li>
                  ))
                ) : (
                  <li style={{ color: '#9ca3af', fontStyle: 'italic' }}>No text found</li>
                )}
              </ul>
            </div>
            
            {/* Faces/Subjects */}
            {analysis.faces && analysis.faces.length > 0 && (
              <div className="result-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>Subjects</h4>
                  <span className="badge">{analysis.faces.length}</span>
                </div>
                <ul className="result-list">
                  {analysis.faces.map((face, idx) => (
                    <li key={idx} style={{ 
                      background: '#ffd69cff', 
                      padding: '0.75rem',
                      borderRadius: '6px',
                      borderLeft: '3px solid #f59e0b',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {safeGet(face, 'species') || safeGet(face, 'gender') || 'Person'} {idx + 1}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                          <span>Age: {safeGet(face, 'age', 'Unknown')}</span>
                          <span>Mood: {safeJoin(face.emotions)}</span>
                          {face.smile && <span>Smile: {face.smile}</span>}
                          {face.glasses && <span>Glasses: {face.glasses}</span>}
                          {face.pose && <span>Pose: {face.pose}</span>}
                          {face.expression && <span>Expression: {face.expression}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Azure Categories */}
            {analysis.categories && analysis.categories.length > 0 && (
              <div className="result-item">
                <h4>Azure Categories</h4>
                <ul className="result-list">
                  {analysis.categories.map((cat, idx) => (
                    <li key={idx}>
                      <strong>{cat.name.replace('_', ' ')}:</strong> {(parseFloat(cat.score) * 100).toFixed(1)}%
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Azure Tags */}
            {analysis.tags && analysis.tags.length > 0 && (
              <div className="result-item">
                <h4>Azure Tags</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {analysis.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: '#98d5fdff',
                        color: '#0369a1',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        border: '1px solid #000304ff'
                      }}
                    >
                      {tag.name} ({(parseFloat(tag.confidence) * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Color Analysis */}
            {analysis.colors && (
              <div className="result-item">
                <h4>Color Analysis</h4>
                <ul className="result-list">
                  {analysis.colors.dominantColors && (
                    <li>
                      <strong>Dominant Colors:</strong> {analysis.colors.dominantColors.join(', ')}
                    </li>
                  )}
                  {analysis.colors.dominantColorForeground && (
                    <li>
                      <strong>Foreground:</strong> 
                      <span 
                        style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          background: analysis.colors.dominantColorForeground,
                          margin: '0 0.5rem',
                          borderRadius: '2px',
                          border: '1px solid #ccc'
                        }}
                      ></span>
                      {analysis.colors.dominantColorForeground}
                    </li>
                  )}
                  {analysis.colors.dominantColorBackground && (
                    <li>
                      <strong>Background:</strong> 
                      <span 
                        style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          background: analysis.colors.dominantColorBackground,
                          margin: '0 0.5rem',
                          borderRadius: '2px',
                          border: '1px solid #ccc'
                        }}
                      ></span>
                      {analysis.colors.dominantColorBackground}
                    </li>
                  )}
                  {analysis.colors.isBWImg && <li><strong>Black & White Image</strong></li>}
                </ul>
              </div>
            )}

            {/* Brands Detection */}
            {analysis.brands && analysis.brands.length > 0 && (
              <div className="result-item">
                <h4>Detected Brands</h4>
                <ul className="result-list">
                  {analysis.brands.map((brand, idx) => (
                    <li key={idx}>• {brand}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Insights */}
            {(analysis.lighting || analysis.environment || analysis.activity || analysis.type || analysis.appeal || analysis.setting) && (
              <div className="result-item">
                <h4>🌟 Additional Insights</h4>
                <ul className="result-list">
                  {analysis.lighting && (
                    <li>
                      <strong>Lighting:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>{analysis.lighting}</span>
                    </li>
                  )}
                  {analysis.environment && (
                    <li>
                      <strong>Environment:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>{analysis.environment}</span>
                    </li>
                  )}
                  {analysis.activity && (
                    <li>
                      <strong>Activity Level:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>{analysis.activity}</span>
                    </li>
                  )}
                  {analysis.appeal && (
                    <li>
                      <strong>Visual Appeal:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>{analysis.appeal}</span>
                    </li>
                  )}
                  {analysis.setting && (
                    <li>
                      <strong>Setting:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>{analysis.setting}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .badge {
          background: #fa9fb8ff;
          color: #222f45ff;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default AnalysisResults;