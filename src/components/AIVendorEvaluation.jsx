import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AIVendorEvaluation = ({ quotes, rfp, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (quotes && quotes.length > 0) {
      analyzeQuotes();
    }
  }, [quotes]);

  const analyzeQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5001/api/ai/analyze-quotes', {
        quotes: quotes,
        rfp: rfp
      });
      
      if (response.data.success) {
        setAnalysis(response.data.analysis);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      // Fallback to client-side analysis
      performClientAnalysis();
    } finally {
      setLoading(false);
    }
  };

  const performClientAnalysis = () => {
    // Simple client-side analysis as fallback
    const prices = quotes.map(q => q.totalPrice);
    const deliveries = quotes.map(q => q.deliveryTime);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDelivery = Math.min(...deliveries);
    const maxDelivery = Math.max(...deliveries);

    const analyzedQuotes = quotes.map(quote => {
      // Price score (0-100, lower price = higher score)
      const priceScore = maxPrice === minPrice ? 100 : 
        ((maxPrice - quote.totalPrice) / (maxPrice - minPrice)) * 100;
      
      // Delivery score (0-100, faster delivery = higher score)
      const deliveryScore = maxDelivery === minDelivery ? 100 : 
        ((maxDelivery - quote.deliveryTime) / (maxDelivery - minDelivery)) * 100;
      
      // Simple overall score (60% price, 40% delivery)
      const overallScore = (priceScore * 0.6) + (deliveryScore * 0.4);

      return {
        ...quote,
        ai_analysis: {
          overall_score: Math.round(overallScore),
          price_score: Math.round(priceScore),
          delivery_score: Math.round(deliveryScore),
          compliance_score: 85, // Default
          vendor_score: 75, // Default
          recommendation: overallScore > 80 ? 'Highly Recommended' : 
                         overallScore > 60 ? 'Recommended' : 'Consider with Caution',
          risk_level: overallScore > 70 ? 'Low' : overallScore > 50 ? 'Medium' : 'High',
          insights: generateSimpleInsights(quote, priceScore, deliveryScore),
          savings: calculateSavings(quote, rfp),
          confidence: 'Medium'
        }
      };
    });

    // Sort by overall score
    analyzedQuotes.sort((a, b) => b.ai_analysis.overall_score - a.ai_analysis.overall_score);

    setAnalysis({
      analyzed_quotes: analyzedQuotes,
      summary: {
        total_quotes: quotes.length,
        average_score: Math.round(analyzedQuotes.reduce((sum, q) => sum + q.ai_analysis.overall_score, 0) / quotes.length),
        best_overall: {
          vendor: analyzedQuotes[0]?.vendorId?.name || 'Unknown',
          score: analyzedQuotes[0]?.ai_analysis?.overall_score || 0
        },
        best_price: {
          vendor: quotes.find(q => q.totalPrice === minPrice)?.vendorId?.name || 'Unknown',
          price: minPrice
        },
        fastest_delivery: {
          vendor: quotes.find(q => q.deliveryTime === minDelivery)?.vendorId?.name || 'Unknown',
          delivery: minDelivery
        }
      },
      recommendations: generateSimpleRecommendations(analyzedQuotes)
    });
  };

  const generateSimpleInsights = (quote, priceScore, deliveryScore) => {
    const insights = [];
    
    if (priceScore > 80) insights.push('💰 Excellent price competitiveness');
    else if (priceScore > 60) insights.push('💵 Good price point');
    else insights.push('💸 Higher price - consider negotiation');
    
    if (deliveryScore > 80) insights.push('🚀 Fast delivery timeline');
    else if (deliveryScore > 60) insights.push('⏰ Reasonable delivery time');
    else insights.push('📅 Longer delivery period');
    
    return insights;
  };

  const calculateSavings = (quote, rfp) => {
    if (rfp.budget && quote.totalPrice < rfp.budget) {
      const savings = rfp.budget - quote.totalPrice;
      return {
        amount: savings,
        percentage: Math.round((savings / rfp.budget) * 100)
      };
    }
    return { amount: 0, percentage: 0 };
  };

  const generateSimpleRecommendations = (analyzedQuotes) => {
    const recommendations = [];
    const best = analyzedQuotes[0];
    
    recommendations.push({
      type: 'top_choice',
      title: '🏆 Best Overall Choice',
      description: `${best?.vendorId?.name || 'Top vendor'} offers the best balance of price and delivery`,
      action: 'Consider awarding contract to this vendor'
    });
    
    const cheapest = analyzedQuotes.reduce((min, q) => 
      q.totalPrice < min.totalPrice ? q : min, analyzedQuotes[0]);
    
    if (cheapest !== best) {
      recommendations.push({
        type: 'cost_saving',
        title: '💰 Lowest Price Option',
        description: `${cheapest?.vendorId?.name || 'Alternative'} offers the lowest price`,
        action: 'Consider if cost is the primary factor'
      });
    }
    
    return recommendations;
  };

  if (loading) {
    return (
      <div className="modal">
        <div className="modal-content simple-ai-analysis">
          <div className="ai-loading">
            <div className="loading-spinner"></div>
            <h3>🤖 Analyzing Quotes</h3>
            <p>Evaluating price and delivery competitiveness...</p>
            <div className="analysis-steps">
              <div className="step completed">✓ Processing quote data</div>
              <div className="step active">📊 Comparing prices</div>
              <div className="step">⏰ Analyzing delivery times</div>
              <div className="step">🎯 Generating recommendations</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="modal">
        <div className="modal-content">
          <div className="error">Unable to analyze quotes</div>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal">
      <div className="modal-content simple-ai-analysis">
        <div className="modal-header">
          <h3>🤖 AI Quote Analysis Results</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {/* Quick Summary */}
        <div className="analysis-summary">
          <div className="summary-cards">
            <div className="summary-card best">
              <div className="card-icon">🏆</div>
              <div className="card-content">
                <h4>Best Overall</h4>
                <p className="vendor-name">{analysis.summary.best_overall.vendor}</p>
                <p className="score">Score: {analysis.summary.best_overall.score}/100</p>
              </div>
            </div>
            
            <div className="summary-card price">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h4>Lowest Price</h4>
                <p className="vendor-name">{analysis.summary.best_price.vendor}</p>
                <p className="amount">${analysis.summary.best_price.price.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="summary-card delivery">
              <div className="card-icon">🚀</div>
              <div className="card-content">
                <h4>Fastest Delivery</h4>
                <p className="vendor-name">{analysis.summary.fastest_delivery.vendor}</p>
                <p className="time">{analysis.summary.fastest_delivery.delivery} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="quotes-analysis">
          <h4>📊 Detailed Quote Analysis</h4>
          {analysis.analyzed_quotes.map((quote, index) => (
            <div key={quote._id} className={`simple-quote-card ${index === 0 ? 'top-ranked' : ''}`}>
              <div className="quote-rank">#{index + 1}</div>
              
              <div className="quote-info">
                <div className="vendor-details">
                  <h5>{quote.vendorId.name}</h5>
                  <span className="company">{quote.vendorId.company}</span>
                  {index === 0 && <span className="winner-badge">🏆 Best Choice</span>}
                </div>
                
                <div className="quote-metrics">
                  <div className="metric-group">
                    <div className="metric">
                      <label>Delivery Score</label>
                      <div className="score-bar">
                        <div 
                          className="score-fill delivery-fill" 
                          style={{width: `${quote.ai_analysis.delivery_score}%`}}
                        ></div>
                        <span>{quote.ai_analysis.delivery_score}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="quote-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Total Price</label>
                      <span className="price">${quote.totalPrice.toLocaleString()}</span>
                      {quote.ai_analysis.savings.amount > 0 && (
                        <span className="savings">Save ${quote.ai_analysis.savings.amount.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="detail-item">
                      <label>Delivery Time</label>
                      <span className="delivery">{quote.deliveryTime} days</span>
                    </div>
                    <div className="detail-item">
                      <label>Risk Level</label>
                      <span className={`risk-badge ${quote.ai_analysis.risk_level.toLowerCase()}`}>
                        {quote.ai_analysis.risk_level}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ai-insights">
                  <div className="recommendation">
                    <span className={`rec-badge ${quote.ai_analysis.recommendation.toLowerCase().replace(/\s+/g, '-')}`}>
                      {quote.ai_analysis.recommendation}
                    </span>
                  </div>
                  <div className="insights-list">
                    {quote.ai_analysis.insights.map((insight, idx) => (
                      <div key={idx} className="insight">{insight}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Recommendations */}
        <div className="ai-recommendations">
          <h4>🎯 AI Recommendations</h4>
          {analysis.recommendations.map((rec, index) => (
            <div key={index} className={`simple-rec-card ${rec.type}`}>
              <div className="rec-content">
                <h5>{rec.title}</h5>
                <p>{rec.description}</p>
                <div className="rec-action">
                  <strong>Recommended Action:</strong> {rec.action}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="analysis-footer">
          <div className="analysis-info">
            <span>📊 Analysis based on price competitiveness and delivery speed</span>
            <span>🤖 Powered by Simple AI Engine</span>
          </div>
          <div className="analysis-actions">
            <button onClick={analyzeQuotes} className="btn btn-secondary">
              🔄 Re-analyze
            </button>
            <button onClick={onClose} className="btn btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  function getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }
};

export default AIVendorEvaluation;