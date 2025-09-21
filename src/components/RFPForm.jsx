import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RFPForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    deadline: '',
    requirements: ['']
  });

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, '']
    });
  };

  const updateRequirement = (index, value) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData({ ...formData, requirements: newRequirements });
  };

  const removeRequirement = (index) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: newRequirements });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'requirements') {
          formDataObj.append(key, JSON.stringify(formData[key].filter(req => req.trim())));
        } else {
          formDataObj.append(key, formData[key]);
        }
      });

      await axios.post('/api/rfps', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error creating RFP:', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Create New RFP</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="RFP Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="IT Hardware">IT Hardware</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Services">Services</option>
          </select>
          
          <input
            type="number"
            placeholder="Budget"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            required
          />
          
          <input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            required
          />
          
          <div className="requirements-section">
            <h4>Requirements</h4>
            {formData.requirements.map((req, index) => (
              <div key={index} className="requirement-row">
                <input
                  type="text"
                  placeholder={`Requirement ${index + 1}`}
                  value={req}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              className="btn btn-secondary"
            >
              Add Requirement
            </button>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Create RFP
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default RFPForm;