import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContractAuditModule = ({ onClose }) => {
  const [contractText, setContractText] = useState('');
  const [auditResults, setAuditResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const auditContract = async () => {
    if (!contractText.trim()) {
      alert('Please enter contract text to audit');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://procurement-ai-india-1758973957.centralindia.azurecontainer.io:5001/api/ai/audit-contract', {
        contract_text: contractText,
        metadata: {
          audit_date: new Date().toISOString(),
          auditor: 'AI System'
        }
      });
      
      if (response.data.success) {
        setAuditResults(response.data.audit_results);
      } else {
        throw new Error('Audit failed');
      }
    } catch (error) {
      console.error('Contract Audit Error:', error);
      setError('Contract audit service unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const uploadContract = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContractText(e.target.result);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a text file (.txt)');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content contract-audit">
        <div className="modal-header">
          <h3>📋 Contract Audit Module</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {!auditResults ? (
          <div className="audit-input">
            <div className="input-options">
              <div className="upload-section">
                <h4>Upload Contract File</h4>
                <input 
                  type="file" 
                  accept=".txt"
                  onChange={uploadContract}
                  className="file-input"
                />
              </div>
              
              <div className="text-input-section">
                <h4>Or Paste Contract Text</h4>
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Paste your contract text here for AI analysis..."
                  rows={15}
                  className="contract-textarea"
                />
              </div>
            </div>

            <div className="audit-actions">
              <button 
                onClick={auditContract} 
                className="btn btn-primary"
                disabled={loading || !contractText.trim()}
              >
                {loading ? 'Analyzing Contract...' : '🔍 Start AI Audit'}
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {loading && (
              <div className="audit-loading">
                <div className="loading-spinner"></div>
                <p>🤖 AI is analyzing your contract...</p>
                <div className="audit-steps">
                  <div className="step">✓ Parsing contract text</div>
                  <div className="step">⏳ Identifying risk factors</div>
                  <div className="step">⏳ Checking compliance</div>
                  <div className="step">⏳ Generating recommendations</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="audit-results">
            <div className="audit-summary">
              <div className="summary-header">
                <h4>📊 Audit Summary</h4>
                <div className={`risk-score ${getRiskScoreClass(auditResults.overall_risk_score)}`}>
                  Risk Score: {auditResults.overall_risk_score}/100
                </div>
              </div>
              
              <div className="summary-stats">
                <div className="stat">
                  <label>Overall Assessment</label>
                  <span>{auditResults.summary.overall_assessment}</span>
                </div>
                <div className="stat">
                  <label>Total Issues Found</label>
                  <span>{auditResults.summary.total_issues}</span>
                </div>
                <div className="stat">
                  <label>High Priority Issues</label>
                  <span>{auditResults.summary.high_priority_issues}</span>
                </div>
                <div className="stat">
                  <label>Recommendation</label>
                  <span>{auditResults.summary.recommendation}</span>
                </div>
              </div>
            </div>

            <div className="audit-sections">
              {/* Risk Factors */}
              {auditResults.risk_factors.length > 0 && (
                <div className="audit-section">
                  <h4>⚠️ Risk Factors Identified</h4>
                  {auditResults.risk_factors.map((risk, index) => (
                    <div key={index} className={`risk-item ${risk.severity.toLowerCase()}`}>
                      <div className="risk-header">
                        <span className="risk-category">{risk.category}</span>
                        <span className={`severity-badge ${risk.severity.toLowerCase()}`}>
                          {risk.severity}
                        </span>
                      </div>
                      <p className="risk-description">{risk.description}</p>
                      <p className="risk-recommendation">
                        <strong>Recommendation:</strong> {risk.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Compliance Issues */}
              {auditResults.compliance_issues.length > 0 && (
                <div className="audit-section">
                  <h4>📋 Compliance Issues</h4>
                  {auditResults.compliance_issues.map((issue, index) => (
                    <div key={index} className={`compliance-item ${issue.severity.toLowerCase()}`}>
                      <div className="compliance-header">
                        <span className="compliance-type">{issue.type}</span>
                        <span className={`severity-badge ${issue.severity.toLowerCase()}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="compliance-description">{issue.description}</p>
                      <p className="compliance-recommendation">
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Key Terms */}
              {auditResults.key_terms && Object.keys(auditResults.key_terms).length > 0 && (
                <div className="audit-section">
                  <h4>🔍 Key Terms Identified</h4>
                  <div className="key-terms">
                    {Object.entries(auditResults.key_terms).map(([category, terms]) => (
                      <div key={category} className="term-category">
                        <h5>{category.replace('_', ' ').toUpperCase()}</h5>
                        <div className="terms-list">
                          {Array.isArray(terms) ? terms.join(', ') : terms}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="audit-section">
                <h4>🎯 AI Recommendations</h4>
                {auditResults.recommendations.map((rec, index) => (
                  <div key={index} className={`rec-item ${rec.priority.toLowerCase()}`}>
                    <div className="rec-header">
                      <span className="rec-title">{rec.title}</span>
                      <span className={`priority-badge ${rec.priority.toLowerCase()}`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="rec-description">{rec.description}</p>
                    <p className="rec-action">
                      <strong>Action Required:</strong> {rec.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="audit-actions">
              <button 
                onClick={() => setAuditResults(null)}
                className="btn btn-secondary"
              >
                Audit Another Contract
              </button>
              <button 
                onClick={() => {
                  const dataStr = JSON.stringify(auditResults, null, 2);
                  const dataBlob = new Blob([dataStr], {type: 'application/json'});
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'contract-audit-report.json';
                  link.click();
                }}
                className="btn btn-primary"
              >
                📥 Download Audit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function getRiskScoreClass(score) {
    if (score < 30) return 'low-risk';
    if (score < 60) return 'medium-risk';
    return 'high-risk';
  }
};

export default ContractAuditModule;