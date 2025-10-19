import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserStatistics, UserStatistics } from '../services/api';
import AuthModal from './AuthModal';

const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserStats();
    }
  }, [isAuthenticated]);

  const loadUserStats = async () => {
    setLoadingStats(true);
    try {
      const statistics = await getUserStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load user statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* User Stats Preview */}
        {stats && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center',
            background: '#f8fafc',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#d73bf6ff' }}>
                {stats.totalAnalyses}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Analyses</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#10b981' }}>
                {stats.recentActivity}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>This Week</div>
            </div>
          </div>
        )}

        {/* User Info and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: '#1f2937' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {user.email}
            </div>
            {loadingStats && (
              <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                Loading stats...
              </div>
            )}
          </div>
          
          {/* Profile Dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={logout}
              className="secondary-button"
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="Click to logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>
          Sign in to save your analyses
        </div>
        <button
          onClick={() => setShowAuthModal(true)}
          className="primary-button"
          style={{ 
            padding: '0.5rem 1rem', 
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Sign In
        </button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </>
  );
};

export default UserProfile;