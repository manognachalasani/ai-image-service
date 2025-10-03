import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            {user.username}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {user.email}
          </div>
        </div>
        <button
          onClick={logout}
          className="secondary-button"
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setShowAuthModal(true)}
          className="primary-button"
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          Sign In / Register
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