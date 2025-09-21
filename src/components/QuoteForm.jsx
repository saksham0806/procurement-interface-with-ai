import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuoteForm = ({ rfp, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    totalPrice: '',
    deliveryTime: '',
    terms: '',
    items: [{
      description: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: ''
    }]
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        description: '',
        quantity: 1,
        unitPrice: '',
        totalPrice: ''
      }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-calculate total price for item
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].totalPrice = (quantity * unitPrice).toFixed(2);
    }
    
    setFormData({ ...formData, items: newItems });
    
    // Calculate total price
    const total = newItems.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
    setFormData(prev => ({ ...prev, items: newItems, totalPrice: total.toFixed(2) }));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    
    // Recalculate total
    const total = newItems.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
    setFormData(prev => ({ ...prev, items: newItems, totalPrice: total.toFixed(2) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();
      formDataObj.append('rfpId', rfp._id);
      formDataObj.append('totalPrice', formData.totalPrice);
      formDataObj.append('deliveryTime', formData.deliveryTime);
      formDataObj.append('terms', formData.terms);
      formDataObj.append('items', JSON.stringify(formData.items));

      await axios.post('/api/quotes', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Error submitting quote. Please try again.');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Submit Quote for: {rfp.title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="items-section">
            <h4>Quote Items</h4>
            {formData.items.map((item, index) => (
              <div key={index} className="item-row">
                <input
                  type="text"
                  placeholder="Item Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  required
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                  required
                  step="0.01"
                  min="0"
                />
                <input
                  type="text"
                  placeholder="Total Price"
                  value={item.totalPrice}
                  readOnly
                  className="readonly-input"
                />
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="btn btn-secondary"
            >
              Add Item
            </button>
          </div>

          <input
            type="number"
            placeholder="Delivery Time (days)"
            value={formData.deliveryTime}
            onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
            required
            min="1"
          />

          <textarea
            placeholder="Terms and Conditions"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            rows={4}
          />

          <div className="total-section">
            <h4>Total Quote Amount: ${formData.totalPrice || '0.00'}</h4>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Submit Quote
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

export default QuoteForm;