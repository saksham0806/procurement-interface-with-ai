import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Navbar from "./components/Navbar"
import Login from "./components/Login"
import Dashboard from "./components/Dashboard"
import RFPList from './components/RFPList';
import QuoteList from './components/QuoteList';
import PurchaseOrderList from './components/PurchaseOrderList';
import ApprovalCenter from "./components/ApprovalCenter"
import AIDashboard from './components/AIDashboard';
import ContractAuditModule from './components/ContractAuditModule';
import AIVendorEvaluation from './components/AIVendorEvaluation';
import './App.css';

// Set up axios defaults
axios.defaults.baseURL = 'https://procurement-backend-india-1758972620.azurewebsites.net';

// Auth Context
const AuthContext = React.createContext();

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // In a real app, you'd verify the token with the server
      // For now, we'll assume it's valid and decode the user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // You'd typically make an API call to get full user info
        setUser({ id: payload.userId, role: payload.role });
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'rfps':
        return <RFPList user={user} />;
      case 'quotes':
        return <QuoteList user={user} />;
      case 'orders':
        return <PurchaseOrderList user={user} />;
      case 'approvals':
        return <ApprovalCenter user={user} />;
      case 'ai-dashboard':
        return <AIDashboard user={user} />;
      case 'contract-audit':
        return <ContractAuditModule onClose={() => setActiveTab('dashboard')} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="app-content">
        <nav className="sidebar">
          <ul>
            <li>
              <button
                className={activeTab === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'rfps' ? 'active' : ''}
                onClick={() => setActiveTab('rfps')}
              >
                {user.role === 'buyer' ? 'My RFPs' : 'Available RFPs'}
              </button>
            </li>
            {user.role === 'vendor' && (
              <li>
                <button
                  className={activeTab === 'quotes' ? 'active' : ''}
                  onClick={() => setActiveTab('quotes')}
                >
                  My Quotes
                </button>
              </li>
            )}
            <li>
              <button
                className={activeTab === 'orders' ? 'active' : ''}
                onClick={() => setActiveTab('orders')}
              >
                Purchase Orders
              </button>
            </li>
            {(user.role === 'approver' || user.role === 'admin') && (
              <li>
                <button
                  className={activeTab === 'approvals' ? 'active' : ''}
                  onClick={() => setActiveTab('approvals')}
                >
                  Pending Approvals
                </button>
              </li>
            )}
            {user.role === 'buyer' && (
              <li>
                <button
                  className={activeTab === 'ai-dashboard' ? 'active' : ''}
                  onClick={() => setActiveTab('ai-dashboard')}
                >
                  AI Insights
                </button>
              </li>
            )}
            {/* <li>
              <button
                className={activeTab === 'contract-audit' ? 'active' : ''}
                onClick={() => setActiveTab('contract-audit')}
              >
                Contract Audit
              </button>
            </li> */}
          </ul>
        </nav>

        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;