import React, { useState, useEffect } from 'react';
import { searchImages } from '../services/api';

interface PublicAnalysis {
  id: number;
  filename: string;
  objects: string[];
  text: string[];
  faces: any[];
  uploadDate: string;
  imagePath: string;
  thumbnail: string;
  fullImage: string;
  analysisType?: string;
  confidence?: string;
}

const DiscoverGallery: React.FC = () => {
  const [publicAnalyses, setPublicAnalyses] = useState<PublicAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<PublicAnalysis | null>(null);

  useEffect(() => {
    loadPublicAnalyses();
  }, []);

  const loadPublicAnalyses = async () => {
    try {
      setLoading(true);
      // using the search endpoint with empty query to get all public images
      const data = await searchImages('');
      
      const analyses = data.results.map((item: any) => ({
        id: item.id,
        filename: item.filename,
        objects: item.objects || [],
        text: item.text || [],
        faces: item.faces || [],
        uploadDate: item.uploadDate,
        imagePath: item.imagePath,
        thumbnail: `/uploads/thumb-${item.imagePath}`,
        fullImage: `/uploads/${item.imagePath}`,
        analysisType: getAnalysisType(item.objects),
        confidence: '0.85' // default confidence for public gallery
      }));
      
      setPublicAnalyses(analyses);
    } catch (error) {
      console.error('Failed to load public analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisType = (objects: string[]): string => {
    if (!objects || objects.length === 0) return 'general';
    
    const objString = objects.join(' ').toLowerCase();
    if (objString.includes('person') || objString.includes('face')) return 'portrait';
    if (objString.includes('tree') || objString.includes('mountain') || objString.includes('sky')) return 'landscape';
    if (objString.includes('building') || objString.includes('car') || objString.includes('street')) return 'urban';
    if (objString.includes('food') || objString.includes('plate') || objString.includes('meal')) return 'food';
    if (objString.includes('animal') || objString.includes('cat') || objString.includes('dog')) return 'animal';
    if (objString.includes('text') || objString.includes('document')) return 'document';
    return 'general';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await searchImages(searchQuery);
      const analyses = data.results.map((item: any) => ({
        id: item.id,
        filename: item.filename,
        objects: item.objects || [],
        text: item.text || [],
        faces: item.faces || [],
        uploadDate: item.uploadDate,
        imagePath: item.imagePath,
        thumbnail: `/uploads/thumb-${item.imagePath}`,
        fullImage: `/uploads/${item.imagePath}`,
        analysisType: getAnalysisType(item.objects),
        confidence: '0.85'
      }));
      
      setPublicAnalyses(analyses);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = publicAnalyses.filter(analysis => {
    const matchesSearch = searchQuery === '' || 
      analysis.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.objects.some(obj => obj.toLowerCase().includes(searchQuery.toLowerCase())) ||
      analysis.text.some(txt => txt.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || analysis.analysisType === filterType;
    
    return matchesSearch && matchesType;
  });

  const analysisTypes = [
    { value: 'all', label: 'All Types', emoji: '🌍' },
    { value: 'portrait', label: 'Portraits', emoji: '👤' },
    { value: 'landscape', label: 'Landscapes', emoji: '🏞️' },
    { value: 'urban', label: 'Urban', emoji: '🏙️' },
    { value: 'food', label: 'Food', emoji: '🍕' },
    { value: 'animal', label: 'Animals', emoji: '🐾' },
    { value: 'document', label: 'Documents', emoji: '📄' },
    { value: 'general', label: 'General', emoji: '🖼️' }
  ];

  if (selectedAnalysis) {
    return (
      <div className="discover-detail">
        <div className="detail-header">
          <button 
            onClick={() => setSelectedAnalysis(null)}
            className="back-button"
            style={{
              padding: '0.5rem 1rem',
              background: '#f8d7ffff',
              color: 'black',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Discover
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div>
              <img 
                src={`http://localhost:5000${selectedAnalysis.thumbnail}`} 
                alt={selectedAnalysis.filename}
                style={{ 
                  width: '300px', 
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '8px', 
                  border: '2px solid #000000ff' 
                }}
                onError={(e) => {
                  // Fallback to full image if thumbnail doesn't exist
                  e.currentTarget.src = `http://localhost:5000/uploads/${selectedAnalysis.imagePath}`;
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h2>{selectedAnalysis.filename}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                
                <div className="result-item">
                  <h4>Analysis Type</h4>
                  <p style={{ 
                    background: '#d240ffff', 
                    color: 'white', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    display: 'inline-block',
                    textTransform: 'capitalize'
                  }}>
                    {selectedAnalysis.analysisType}
                  </p>
                </div>

                {selectedAnalysis.objects.length > 0 && (
                  <div className="result-item">
                    <h4>Objects Detected</h4>
                    <ul className="result-list">
                      {selectedAnalysis.objects.map((obj, idx) => (
                        <li key={idx}>• {obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedAnalysis.text.length > 0 && (
                  <div className="result-item">
                    <h4>Text Found</h4>
                    <ul className="result-list">
                      {selectedAnalysis.text.map((txt, idx) => (
                        <li key={idx} style={{ fontStyle: 'italic' }}>"{txt}"</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedAnalysis.faces.length > 0 && (
                  <div className="result-item">
                    <h4>Subjects</h4>
                    <p>{selectedAnalysis.faces.length} face(s) detected</p>
                  </div>
                )}

                <div className="result-item">
                  <h4>Upload Date</h4>
                  <p>{new Date(selectedAnalysis.uploadDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-gallery">
      <div className="gallery-header">
        <div>
          <h1>Discover Community Analyses</h1>
          <p>Explore images analyzed by users worldwide</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filters">
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search by filename, objects, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #000000ff',
              borderRadius: '8px',
              flex: 1,
              fontSize: '1rem'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#d240ffff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            Search
          </button>
        </form>

        <div className="filter-buttons">
          {analysisTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`filter-button ${filterType === type.value ? 'active' : ''}`}
              style={{
                padding: '0.5rem 1rem',
                background: filterType === type.value ? '#d240ffff' : '#f3f4f6',
                color: filterType === type.value ? 'white' : '#374151',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {type.emoji} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div>Loading community analyses...</div>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No analyses found</h3>
          <p>Try changing your search or filter criteria.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredAnalyses.map((analysis) => (
            <div 
              key={analysis.id} 
              className="gallery-card"
              onClick={() => setSelectedAnalysis(analysis)}
            >
              <img 
                src={`http://localhost:5000${analysis.thumbnail}`} 
                alt={analysis.filename}
                className="gallery-thumbnail"
                onError={(e) => {
                  // Fallback to full image if thumbnail doesn't exist
                  e.currentTarget.src = `http://localhost:5000/uploads/${analysis.imagePath}`;
                }}
              />
              
              <div className="card-content">
                <h4 title={analysis.filename}>
                  {analysis.filename.length > 25 
                    ? `${analysis.filename.substring(0, 25)}...` 
                    : analysis.filename
                  }
                </h4>
                
                <div className="analysis-badges">
                  <span className="badge type-badge">{analysis.analysisType}</span>
                  <span className="badge">{analysis.objects.length} objects</span>
                  {analysis.faces.length > 0 && (
                    <span className="badge">{analysis.faces.length} faces</span>
                  )}
                </div>
                
                <div className="card-meta">
                  <small>{new Date(analysis.uploadDate).toLocaleDateString()}</small>
                </div>

                <div className="click-hint">
                  <small>Click to view details →</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .discover-gallery {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .gallery-header {
          margin-bottom: 2rem;
        }
        
        .search-filters {
          margin-bottom: 2rem;
        }
        
        .search-bar {
          display: flex;
          margin-bottom: 1rem;
          gap: 0.5rem;
        }
        
        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        
        .gallery-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        
        .gallery-card:hover {
          border-color: #d240ffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .gallery-thumbnail {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        
        .analysis-badges {
          display: flex;
          gap: 0.5rem;
          margin: 0.5rem 0;
          flex-wrap: wrap;
        }
        
        .badge {
          background: #e5e7eb;
          color: #4d3751ff;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .type-badge {
          background: #d240ffff;
          color: white;
          text-transform: capitalize;
        }
        
        .card-meta {
          margin: 0.5rem 0;
        }
        
        .card-meta small {
          color: #806b7dff;
          font-size: 0.75rem;
        }
        
        .click-hint {
          text-align: center;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;
        }
        
        .click-hint small {
          color: #d240ffff;
          font-style: italic;
        }
        
        .discover-detail {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .detail-header {
          margin-bottom: 2rem;
        }
        
        .result-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #0b0c0dff;
        }
        
        .result-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .result-list li {
          padding: 0.25rem 0;
          border-bottom: 1px solid #000000ff;
        }
        
        .result-list li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default DiscoverGallery;