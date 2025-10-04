import React, { useState, useEffect } from 'react';
import { getUserAnalysisHistory, UserAnalysis, bulkDeleteAnalyses } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AnalysisResults from './AnalysisResults';

const UserHistory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<UserAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [pagination, setPagination] = useState({ 
    page: 1, 
    limit: 12, 
    total: 0, 
    totalPages: 0 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<UserAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [pagination.page, isAuthenticated]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getUserAnalysisHistory(pagination.page, pagination.limit, searchTerm);
      setHistory(data.history);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadHistory();
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Delete ${selectedItems.length} analyses? This action cannot be undone.`)) {
      try {
        await bulkDeleteAnalyses(selectedItems);
        setSelectedItems([]);
        loadHistory();
        // If we're viewing a deleted analysis, close the detail view
        if (selectedAnalysis && selectedItems.includes(selectedAnalysis.id)) {
          setSelectedAnalysis(null);
          setViewMode('grid');
        }
      } catch (error) {
        console.error('Failed to delete analyses:', error);
      }
    }
  };

  const toggleSelectItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when selecting
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleCardClick = (analysis: UserAnalysis) => {
    setSelectedAnalysis(analysis);
    setViewMode('detail');
  };

  const handleBackToGrid = () => {
    setSelectedAnalysis(null);
    setViewMode('grid');
  };

  const handleViewNext = () => {
    const currentIndex = history.findIndex(item => item.id === selectedAnalysis?.id);
    if (currentIndex < history.length - 1) {
      setSelectedAnalysis(history[currentIndex + 1]);
    }
  };

  const handleViewPrevious = () => {
    const currentIndex = history.findIndex(item => item.id === selectedAnalysis?.id);
    if (currentIndex > 0) {
      setSelectedAnalysis(history[currentIndex - 1]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>🔐 Sign In Required</h2>
        <p>Please sign in to view your analysis history.</p>
      </div>
    );
  }

  // Detail View - Show full analysis
  if (viewMode === 'detail' && selectedAnalysis) {
    const currentIndex = history.findIndex(item => item.id === selectedAnalysis.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < history.length - 1;

    return (
      <div className="detail-view">
        <div className="detail-header">
          <button 
            onClick={handleBackToGrid}
            className="back-button"
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to History
          </button>
          
          <div className="navigation-controls">
            <button
              onClick={handleViewPrevious}
              disabled={!hasPrevious}
              className="nav-button"
              style={{
                padding: '0.5rem 1rem',
                background: hasPrevious ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: hasPrevious ? 'pointer' : 'not-allowed'
              }}
            >
              ← Previous
            </button>
            
            <span style={{ margin: '0 1rem', color: '#6b7280' }}>
              {currentIndex + 1} of {history.length}
            </span>
            
            <button
              onClick={handleViewNext}
              disabled={!hasNext}
              className="nav-button"
              style={{
                padding: '0.5rem 1rem',
                background: hasNext ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: hasNext ? 'pointer' : 'not-allowed'
              }}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="detail-content">
          <AnalysisResults 
            analysis={selectedAnalysis.analysis} 
            imageInfo={selectedAnalysis.imageInfo}
            autoSaved={true}
            analysisId={selectedAnalysis.id}
          />
        </div>
      </div>
    );
  }

  // Grid View - Show history list
  return (
    <div className="user-history">
      <div className="history-header">
        <div>
          <h1>📚 My Analysis History</h1>
          <p>Click on any analysis to view full details</p>
        </div>
        
        {selectedItems.length > 0 && (
          <button 
            onClick={handleBulkDelete} 
            className="btn-danger"
            style={{ 
              padding: '0.75rem 1.5rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🗑️ Delete Selected ({selectedItems.length})
          </button>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search by filename, objects, or text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            flex: 1,
            fontSize: '1rem'
          }}
        />
        <button 
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginLeft: '0.5rem'
          }}
        >
          🔍 Search
        </button>
        {searchTerm && (
          <button 
            type="button"
            onClick={() => {
              setSearchTerm('');
              setPagination(prev => ({ ...prev, page: 1 }));
              loadHistory();
            }}
            style={{
              padding: '0.75rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            Clear
          </button>
        )}
      </form>

      {/* History Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div>Loading your analyses...</div>
        </div>
      ) : history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No analyses found</h3>
          <p>
            {searchTerm 
              ? 'No analyses match your search criteria.' 
              : "You haven't analyzed any images yet. Upload an image to get started!"
            }
          </p>
        </div>
      ) : (
        <>
          <div className="history-grid">
            {history.map((item) => (
              <div 
                key={item.id} 
                className={`history-card ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                onClick={() => handleCardClick(item)}
              >
                <div 
                  className="card-checkbox"
                  onClick={(e) => toggleSelectItem(item.id, e)}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {}}
                  />
                </div>
                
                <img 
                  src={`http://localhost:5000${item.imageInfo.thumbnail}`} 
                  alt={item.imageInfo.originalName}
                  className="history-thumbnail"
                />
                
                <div className="card-content">
                  <h4 title={item.imageInfo.originalName}>
                    {item.imageInfo.originalName.length > 30 
                      ? `${item.imageInfo.originalName.substring(0, 30)}...` 
                      : item.imageInfo.originalName
                    }
                  </h4>
                  
                  <div className="analysis-badges">
                    <span className="badge type-badge">{item.analysis.analysisType}</span>
                    <span className="badge">{item.analysis.objects?.length || 0} objects</span>
                    {item.analysis.faces?.length > 0 && (
                      <span className="badge">{item.analysis.faces.length} faces</span>
                    )}
                    {item.analysis.text?.length > 0 && (
                      <span className="badge">{item.analysis.text.length} text</span>
                    )}
                  </div>
                  
                  <div className="confidence-meter">
                    <div className="confidence-label">
                      Confidence: {(parseFloat(item.analysis.confidence) * 100).toFixed(1)}%
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ 
                          width: `${parseFloat(item.analysis.confidence) * 100}%`,
                          backgroundColor: parseFloat(item.analysis.confidence) > 0.8 ? '#10b981' : 
                                         parseFloat(item.analysis.confidence) > 0.6 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="card-meta">
                    <small>📅 {item.formattedDate}</small>
                    <small>⏱️ {item.analysis.processingTime || '150'}ms</small>
                  </div>

                  <div className="click-hint">
                    <small>Click to view full analysis →</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="pagination-btn"
              >
                ← Previous
              </button>
              
              <span>
                Page {pagination.page} of {pagination.totalPages}
                ({pagination.total} total analyses)
              </span>
              
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .user-history {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        
        .search-bar {
          display: flex;
          margin-bottom: 2rem;
          gap: 0.5rem;
        }
        
        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .history-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          background: white;
        }
        
        .history-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .history-card.selected {
          border-color: #3b82f6;
          background: #f0f9ff;
        }
        
        .card-checkbox {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          z-index: 2;
        }
        
        .card-checkbox input {
          cursor: pointer;
        }
        
        .history-thumbnail {
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
          color: #374151;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .type-badge {
          background: #3b82f6;
          color: white;
          text-transform: capitalize;
        }
        
        .confidence-meter {
          margin: 0.75rem 0;
        }
        
        .confidence-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        
        .confidence-bar {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .confidence-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .card-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin: 0.5rem 0;
        }
        
        .card-meta small {
          color: #6b7280;
          font-size: 0.75rem;
        }
        
        .click-hint {
          text-align: center;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;
        }
        
        .click-hint small {
          color: #3b82f6;
          font-style: italic;
        }
        
        /* Detail View Styles */
        .detail-view {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .navigation-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .detail-content {
          background: white;
          border-radius: 12px;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .pagination-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default UserHistory;