import React, { useState, useEffect } from 'react';
import axios from 'axios';

import RFPForm from "./RFPForm"
import RFPDetails from './RFPDetails';

const RFPList = ({ user }) => {
  const [rfps, setRfps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRfp, setSelectedRfp] = useState(null);

  useEffect(() => {
    fetchRFPs();
  }, []);

  const fetchRFPs = async () => {
    try {
      const response = await axios.get('/api/rfps');
      setRfps(response.data);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
    }
  };

  const publishRFP = async (id) => {
    try {
      await axios.put(`/api/rfps/${id}/publish`);
      fetchRFPs();
    } catch (error) {
      console.error('Error publishing RFP:', error);
    }
  };

  return (
    <div className="rfp-list">
      <div className="section-header">
        <h2>RFPs</h2>
        {user.role === 'buyer' && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Create RFP
          </button>
        )}
      </div>
      
      {showForm && (
        <RFPForm
          onClose={() => setShowForm(false)}
          onSubmit={() => {
            setShowForm(false);
            fetchRFPs();
          }}
        />
      )}

      {selectedRfp && (
        <RFPDetails
          rfpId={selectedRfp}
          onClose={() => setSelectedRfp(null)}
          userRole={user.role}
        />
      )}

      <div className="rfp-grid">
        {rfps.map((rfp) => (
          <div key={rfp._id} className="rfp-card">
            <h3>{rfp.title}</h3>
            <p className="rfp-category">{rfp.category}</p>
            <p className="rfp-budget">Budget: ${rfp.budget.toLocaleString()}</p>
            <p className="rfp-deadline">Deadline: {new Date(rfp.deadline).toLocaleDateString()}</p>
            <p className="rfp-status">{rfp.status}</p>
            
            <div className="rfp-actions">
              {user.role === 'buyer' && rfp.status === 'draft' && (
                <button
                  onClick={() => publishRFP(rfp._id)}
                  className="btn btn-success"
                >
                  Publish
                </button>
              )}
              {user.role === 'vendor' && rfp.status === 'published' && (
                <button 
                  onClick={() => setSelectedRfp(rfp._id)}
                  className="btn btn-primary"
                >
                  Submit Quote
                </button>
              )}
              <button 
                onClick={() => setSelectedRfp(rfp._id)} 
                className="btn btn-secondary"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RFPList;