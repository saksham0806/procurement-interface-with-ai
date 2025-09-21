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
        
        {user.role === 'approver' && (
          <>
            <div className="stat-card">
              <h3>Pending Approvals</h3>
              <p className="stat-number">{stats.pendingApprovals || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Approved This Month</h3>
              <p className="stat-number">{stats.approvedThisMonth || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Value Approved</h3>
              <p className="stat-number">${(stats.totalValueApproved || 0).toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>Average Approval Time</h3>
              <p className="stat-number">{stats.avgApprovalTime || 0} days</p>
            </div>
          </>
        )}
        
        {user.role === 'admin' && (
          <>
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.totalUsers || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Active RFPs</h3>
              <p className="stat-number">{stats.totalActiveRFPs || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Approvals</h3>
              <p className="stat-number">{stats.totalPendingApprovals || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Monthly Volume</h3>
              <p className="stat-number">${(stats.monthlyVolume || 0).toLocaleString()}</p>
            </div>
          </>
        )}
      </div>
      
      {/* Welcome message for users without specific stats */}
      {stats && Object.keys(stats).length === 0 && (
        <div className="welcome-section">
          <div className="welcome-card">
            <h3>Welcome to Procurement Platform!</h3>
            <p>Your dashboard will show relevant statistics as you start using the platform.</p>
            <div className="quick-actions">
              {user.role === 'buyer' && (
                <div>
                  <p>Get started by:</p>
                  <ul>
                    <li>Creating your first RFP</li>
                    <li>Publishing RFPs to receive quotes</li>
                    <li>Managing vendor responses</li>
                  </ul>
                </div>
              )}
              {user.role === 'vendor' && (
                <div>
                  <p>Get started by:</p>
                  <ul>
                    <li>Browsing available RFPs</li>
                    <li>Submitting competitive quotes</li>
                    <li>Tracking quote status</li>
                  </ul>
                </div>
              )}
              {user.role === 'approver' && (
                <div>
                  <p>Your role includes:</p>
                  <ul>
                    <li>Reviewing purchase orders</li>
                    <li>Approving procurement requests</li>
                    <li>Managing approval workflows</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;