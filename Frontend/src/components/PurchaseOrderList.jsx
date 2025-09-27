import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PurchaseOrderList = ({ user }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/purchase-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div className="order-list">
      <h2>Purchase Orders</h2>
      <div className="order-grid">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <h3>PO: {order.poNumber}</h3>
            <p className="order-rfp">{order.rfpId?.title}</p>
            <p className="order-amount">Amount: ${order.totalAmount.toLocaleString()}</p>
            <p className="order-vendor">
              {user.role === 'buyer' ? `Vendor: ${order.vendorId?.name}` : `Buyer: ${order.buyerId?.name}`}
            </p>
            <p className="order-status">{order.status}</p>
            <p className="order-date">
              Created: {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchaseOrderList;