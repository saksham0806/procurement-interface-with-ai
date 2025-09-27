import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApprovalCenter = ({ user }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('/api/purchase-orders');
      const orders = response.data.filter(order => order.status === 'pending');
      setPendingOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (orderId) => {
    try {
      await axios.put(`/api/purchase-orders/${orderId}/approve`, {
        status: 'approved',
        comments: 'Approved by ' + user.name
      });
      alert('Purchase Order approved successfully!');
      fetchPendingOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Error approving order. Please try again.');
    }
  };

  const rejectOrder = async (orderId) => {
    const comments = prompt('Please enter rejection reason:');
    if (comments) {
      try {
        await axios.put(`/api/purchase-orders/${orderId}/approve`, {
          status: 'rejected',
          comments: comments
        });
        alert('Purchase Order rejected.');
        fetchPendingOrders();
      } catch (error) {
        console.error('Error rejecting order:', error);
        alert('Error rejecting order. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading pending orders...</div>;
  }

  return (
    <div className="approval-center">
      <h2>Pending Approvals</h2>
      {pendingOrders.length === 0 ? (
        <div className="no-orders">
          <p>No pending orders for approval.</p>
        </div>
      ) : (
        <div className="approval-grid">
          {pendingOrders.map((order) => (
            <div key={order._id} className="approval-card">
              <div className="approval-header">
                <h3>PO: {order.poNumber}</h3>
                <span className="approval-status">{order.status}</span>
              </div>
              
              <div className="approval-details">
                <div className="detail-item">
                  <label>RFP:</label>
                  <span>{order.rfpId?.title}</span>
                </div>
                <div className="detail-item">
                  <label>Vendor:</label>
                  <span>{order.vendorId?.name} ({order.vendorId?.company})</span>
                </div>
                <div className="detail-item">
                  <label>Buyer:</label>
                  <span>{order.buyerId?.name} ({order.buyerId?.company})</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span className="amount">${order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Created:</label>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="approval-actions">
                <button
                  onClick={() => approveOrder(order._id)}
                  className="btn btn-success"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectOrder(order._id)}
                  className="btn btn-danger"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalCenter;