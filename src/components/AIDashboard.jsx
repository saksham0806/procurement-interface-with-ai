import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AIDashboard = ({ user }) => {
  return (
    <div className="simple-ai-dashboard">
      <h2>AI Procurement Assistant</h2>
      
      <div className="ai-features">
        <div className="feature-card active">
          <div className="feature-icon">📊</div>
          <div className="feature-content">
            <h3>Smart Quote Analysis</h3>
            <p>Automatically evaluates vendor quotes based on price competitiveness and delivery speed</p>
            <div className="feature-metrics">
              <span>2-second analysis</span>
              <span>Mathematical scoring</span>
              <span>Clear recommendations</span>
            </div>
          </div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <div className="feature-content">
            <h3>Price Optimization</h3>
            <p>Identifies cost-saving opportunities and budget alignment</p>
            <div className="feature-metrics">
              <span>Savings calculation</span>
              <span>Price comparison</span>
              <span>Best value detection</span>
            </div>
          </div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon"></div>
          <div className="feature-content">
            <h3>Delivery Analysis</h3>
            <p>Evaluates delivery timelines against project deadlines</p>
            <div className="feature-metrics">
              <span>Timeline analysis</span>
              <span>Deadline compliance</span>
              <span>Speed ranking</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <h3>🔍 How AI Analysis Works</h3>
        <div className="process-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Data Collection</h4>
              <p>Gathers quote prices, delivery times, and RFP requirements</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Mathematical Analysis</h4>
              <p>Calculates scores using weighted algorithms (60% price, 40% delivery)</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Smart Recommendations</h4>
              <p>Provides clear recommendations with confidence levels</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;