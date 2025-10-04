import React, { useState, useEffect } from 'react';
import { getUserStatistics, UserStatistics } from '../services/api';
import './App.css';

const UserDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await getUserStatistics();
      setStats(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="user-dashboard">
      <h2>Your Analytics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Analyses</h3>
          <p className="stat-number">{stats.totalAnalyses}</p>
        </div>
        <div className="stat-card">
          <h3>This Week</h3>
          <p className="stat-number">{stats.recentActivity}</p>
        </div>
        <div className="stat-card">
          <h3>Weekly Average</h3>
          <p className="stat-number">{stats.averagePerWeek}</p>
        </div>
      </div>
      
      <div className="analysis-types">
        <h3>Analysis by Type</h3>
        {Object.entries(stats.analysesByType).map(([type, count]) => (
          <div key={type} className="type-item">
            <span className="type-name">{type}</span>
            <span className="type-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;