import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        {user.role === 'buyer' && (
          <>
            <div className="stat-card">
              <h3>Total RFPs</h3>
              <p className="stat-number">{stats.totalRFPs || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Active RFPs</h3>
              <p className="stat-number">{stats.activeRFPs || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p className="stat-number">{stats.totalOrders || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Orders</h3>
              <p className="stat-number">{stats.pendingOrders || 0}</p>
            </div>
          </>
        )}
        {user.role === 'vendor' && (
          <>
            <div className="stat-card">
              <h3>Total Quotes</h3>
              <p className="stat-number">{stats.totalQuotes || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Accepted Quotes</h3>
              <p className="stat-number">{stats.acceptedQuotes || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p className="stat-number">{stats.totalOrders || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Active Orders</h3>
              <p className="stat-number">{stats.activeOrders || 0}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;