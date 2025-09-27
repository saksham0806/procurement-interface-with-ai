import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuoteForm from './QuoteForm';
import AIVendorEvaluation from './AIVendorEvaluation';

// Add this component in App.js
const RFPDetails = ({ rfpId, onClose, userRole }) => {
  const [rfp, setRfp] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  useEffect(() => {
    fetchRFPDetails();
    if (userRole === 'buyer') {
      fetchQuotes();
    }
  }, [rfpId]);

  const fetchRFPDetails = async () => {
    try {
      const response = await axios.get(`/api/rfps/${rfpId}`);
      setRfp(response.data);
    } catch (error) {
      console.error('Error fetching RFP details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(`/api/quotes/rfp/${rfpId}`);
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const createPurchaseOrder = async (quoteId, vendorId) => {
    try {
      await axios.post('/api/purchase-orders', {
        rfpId: rfp._id,
        quoteId,
        vendorId
      });
      alert('Purchase Order created successfully!');
      fetchQuotes();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Error creating purchase order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="modal">
        <div className="modal-content">
          <div className="loading">Loading RFP details...</div>
        </div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="modal">
        <div className="modal-content">
          <div className="error">RFP not found</div>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal">
      <div className="modal-content rfp-details">
        <div className="modal-header">
          <h3>{rfp.title}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="rfp-info">
          <div className="info-grid">
            <div className="info-item">
              <label>Category:</label>
              <span>{rfp.category}</span>
            </div>
            <div className="info-item">
              <label>Budget:</label>
              <span>${rfp.budget.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>Deadline:</label>
              <span>{new Date(rfp.deadline).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span className="status-badge">{rfp.status}</span>
            </div>
            <div className="info-item">
              <label>Created by:</label>
              <span>{rfp.createdBy?.name} ({rfp.createdBy?.company})</span>
            </div>
            <div className="info-item">
              <label>Created on:</label>
              <span>{new Date(rfp.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="description-section">
            <label>Description:</label>
            <p>{rfp.description}</p>
          </div>

          {rfp.requirements && rfp.requirements.length > 0 && (
            <div className="requirements-section">
              <label>Requirements:</label>
              <ul>
                {rfp.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {userRole === 'vendor' && rfp.status === 'published' && (
          <div className="vendor-actions">
            <button
              onClick={() => setShowQuoteForm(true)}
              className="btn btn-primary"
            >
              Submit Quote
            </button>
          </div>
        )}
        {userRole === 'buyer' && quotes.length > 0 && (
          <div className="ai-analysis-section">
            <button
              onClick={() => setShowAIAnalysis(true)}
              className="btn btn-primary ai-btn"
            >
              Run AI Analysis
            </button>
          </div>
        )}

        {showAIAnalysis && (
          <AIVendorEvaluation
            quotes={quotes}
            rfp={rfp}
            onClose={() => setShowAIAnalysis(false)}
          />
        )}

        {userRole === 'buyer' && quotes.length > 0 && (
          <div className="quotes-section">
            <h4>Received Quotes ({quotes.length})</h4>
            <div className="quotes-list">
              {quotes.map((quote) => (
                <div key={quote._id} className="quote-item">
                  <div className="quote-header">
                    <h5>{quote.vendorId.name}</h5>
                    <span className="quote-company">{quote.vendorId.company}</span>
                  </div>
                  <div className="quote-details">
                    <div className="quote-price">
                      <label>Total Price:</label>
                      <span>${quote.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="quote-delivery">
                      <label>Delivery Time:</label>
                      <span>{quote.deliveryTime} days</span>
                    </div>
                    <div className="quote-status">
                      <label>Status:</label>
                      <span className="status-badge">{quote.status}</span>
                    </div>
                  </div>
                  <div className="quote-actions">
                    <span className="quote-date">
                      Submitted: {new Date(quote.submittedAt).toLocaleDateString()}
                    </span>
                    {quote.status === 'submitted' && (
                      <button
                        onClick={() => createPurchaseOrder(quote._id, quote.vendorId._id)}
                        className="btn btn-success"
                      >
                        Accept Quote
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showQuoteForm && (
        <QuoteForm
          rfp={rfp}
          onClose={() => setShowQuoteForm(false)}
          onSubmit={() => {
            setShowQuoteForm(false);
            alert('Quote submitted successfully!');
          }}
        />
      )}
    </div>
  );
};

export default RFPDetails;