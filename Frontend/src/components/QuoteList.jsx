import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuoteList = ({ user }) => {
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get('/api/quotes/vendor');
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  return (
    <div className="quote-list">
      <h2>My Quotes</h2>
      <div className="quote-grid">
        {quotes.map((quote) => (
          <div key={quote._id} className="quote-card">
            <h3>{quote.rfpId.title}</h3>
            <p className="quote-category">{quote.rfpId.category}</p>
            <p className="quote-price">Total: ${quote.totalPrice.toLocaleString()}</p>
            <p className="quote-delivery">Delivery: {quote.deliveryTime} days</p>
            <p className="quote-status">{quote.status}</p>
            <p className="quote-date">
              Submitted: {new Date(quote.submittedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuoteList;