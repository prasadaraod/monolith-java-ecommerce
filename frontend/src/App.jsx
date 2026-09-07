import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'cart' | 'checkout' | 'orders' | 'login' | 'register'
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Sandbox Payment States
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [sandboxOutcome, setSandboxOutcome] = useState('SUCCESS'); // 'SUCCESS' | 'FAILED'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  useEffect(() => {
    fetchProducts();
    if (token) {
      fetchUserProfile();
      fetchCart();
      fetchOrders();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/products`);
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        logout();
      }
    } catch (err) {
      logout();
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCart(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({ email: data.email, fullName: data.fullName, role: data.role });
      showNotification('success', `Welcome back, ${data.fullName}!`);
      setActiveTab('home');
      setEmail('');
      setPassword('');
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({ email: data.email, fullName: data.fullName, role: data.role });
      showNotification('success', `Account created successfully! Welcome, ${data.fullName}`);
      setActiveTab('home');
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/v1/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');

      showNotification('success', 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordModal(false);
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setCart(null);
    setOrders([]);
    setActiveTab('home');
    setShowPasswordModal(false);
    showNotification('info', 'Logged out successfully.');
  };

  const addToCart = async (productId) => {
    if (!token) {
      showNotification('error', 'Please log in to add items to your cart.');
      setActiveTab('login');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (res.ok) {
        setCart(await res.json());
        showNotification('success', 'Item added to cart!');
      } else {
        const err = await res.json();
        showNotification('error', err.message || 'Could not add to cart.');
      }
    } catch (err) {
      showNotification('error', 'Network error adding to cart.');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/v1/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCart(await res.json());
        showNotification('info', 'Item removed from cart.');
      }
    } catch (err) {
      showNotification('error', 'Failed to remove item.');
    }
  };

  const submitSandboxPayment = async () => {
    setIsProcessingPayment(true);
    // Simulate realistic payment gateway processing delay
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/orders/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ simulation: sandboxOutcome })
        });
        const orderData = await res.json();
        setIsProcessingPayment(false);

        if (res.ok) {
          if (orderData.status === 'PAID') {
            showNotification('success', `Payment Authorized! Order #${orderData.orderId} placed successfully.`);
            fetchCart();
            fetchOrders();
            fetchProducts();
            setActiveTab('orders');
          } else {
            showNotification('error', `Transaction Declined! Order #${orderData.orderId} marked as CANCELLED.`);
            fetchOrders();
            setActiveTab('orders');
          }
        } else {
          showNotification('error', orderData.message || 'Transaction rejected by server.');
        }
      } catch (err) {
        setIsProcessingPayment(false);
        showNotification('error', 'Failed to connect to checkout service.');
      }
    }, 1200);
  };

  const totalCartItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 1200, margin: '0 auto', padding: '0 20px 40px', color: '#1f2937' }}>
      
      {/* 1. TOP HEADER & AUTH STATUS BAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, cursor: 'pointer', color: '#111827' }} onClick={() => setActiveTab('home')}>
            Java Monolith Store
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
              <span style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                Logged in: {user.fullName} ({user.role})
              </span>
              <button 
                onClick={() => setShowPasswordModal(!showPasswordModal)} 
                style={{ padding: '6px 12px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                Change Password
              </button>
              <button 
                onClick={logout} 
                style={{ padding: '6px 12px', border: 'none', background: '#f3f4f6', color: '#374151', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                Logout
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 14, color: '#6b7280', background: '#f9fafb', padding: '4px 10px', borderRadius: 20 }}>
              Status: Not Logged In (Guest)
            </span>
          )}
        </div>
      </header>

      {/* 2. MAIN NAVIGATION BAR */}
      <nav style={{ display: 'flex', gap: 10, padding: '14px 0', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('home')}
          style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'home' ? '#2563eb' : '#f3f4f6', color: activeTab === 'home' ? '#fff' : '#374151' }}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'cart' ? '#2563eb' : '#f3f4f6', color: activeTab === 'cart' ? '#fff' : '#374151' }}
        >
          Cart ({totalCartItems})
        </button>
        <button
          onClick={() => {
            if (!token) {
              showNotification('error', 'Please log in to proceed to checkout.');
              setActiveTab('login');
            } else if (!cart || cart.items.length === 0) {
              showNotification('info', 'Your cart is empty. Add items first.');
              setActiveTab('home');
            } else {
              setActiveTab('checkout');
            }
          }}
          style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'checkout' ? '#2563eb' : '#f3f4f6', color: activeTab === 'checkout' ? '#fff' : '#374151' }}
        >
          Checkout
        </button>
        <button
          onClick={() => {
            if (!token) {
              showNotification('error', 'Please log in to view orders.');
              setActiveTab('login');
            } else {
              fetchOrders();
              setActiveTab('orders');
            }
          }}
          style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'orders' ? '#2563eb' : '#f3f4f6', color: activeTab === 'orders' ? '#fff' : '#374151' }}
        >
          Orders ({orders.length})
        </button>

        {!user && (
          <>
            <button
              onClick={() => setActiveTab('login')}
              style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'login' ? '#111827' : '#f3f4f6', color: activeTab === 'login' ? '#fff' : '#374151' }}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'register' ? '#111827' : '#f3f4f6', color: activeTab === 'register' ? '#fff' : '#374151' }}
            >
              Register
            </button>
          </>
        )}
      </nav>

      {/* 3. ORDER / ACTION NOTIFICATION BANNER */}
      {notification && (
        <div style={{
          marginTop: 16,
          padding: '14px 20px',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: notification.type === 'success' ? '#dcfce7' : notification.type === 'error' ? '#fee2e2' : '#e0e7ff',
          color: notification.type === 'success' ? '#166534' : notification.type === 'error' ? '#991b1b' : '#3730a3',
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : notification.type === 'error' ? '#fecaca' : '#c7d2fe'}`
        }}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* 4. PASSWORD MODAL */}
      {showPasswordModal && user && (
        <div style={{ border: '1px solid #bfdbfe', background: '#f8fafd', borderRadius: 8, padding: 18, margin: '20px 0' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Change Account Password</h4>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="Current Password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ padding: 8, minWidth: 200, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ padding: 8, minWidth: 200, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
              Update
            </button>
            <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '8px 14px', cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6 }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* 5. DYNAMIC VIEWS */}
      
      {/* TAB A: HOME PAGE */}
      {activeTab === 'home' && (
        <div style={{ marginTop: 24 }}>
          {/* Cart & Order Quick Summary Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Cart Summary</span>
                <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700 }}>
                  {totalCartItems} Items | ₹{cart?.totalAmount || '0.00'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('cart')} 
                style={{ padding: '6px 14px', borderRadius: 6, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                Open Cart
              </button>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Orders Summary</span>
                <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700 }}>
                  {user ? `${orders.length} Placed Orders` : 'Login to view orders'}
                </p>
              </div>
              <button 
                onClick={() => {
                  if (!user) setActiveTab('login');
                  else { fetchOrders(); setActiveTab('orders'); }
                }} 
                style={{ padding: '6px 14px', borderRadius: 6, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                View Orders
              </button>
            </div>
          </div>

          <h3 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Product Catalog</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
            {products.map(p => (
              <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fff' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>{p.name}</h4>
                  <p style={{ color: '#6b7280', fontSize: 13, minHeight: 40, margin: '0 0 12px 0' }}>{p.description}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>
                    <strong style={{ fontSize: 17 }}>₹{p.price}</strong> <span style={{ color: '#6b7280' }}>| Stock: {p.stockQuantity}</span>
                  </p>
                  <button
                    disabled={p.stockQuantity < 1}
                    onClick={() => addToCart(p.id)}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: 6,
                      border: 'none',
                      background: p.stockQuantity > 0 ? '#2563eb' : '#f3f4f6',
                      color: p.stockQuantity > 0 ? '#fff' : '#9ca3af',
                      cursor: p.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    {p.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB B: SEPARATE CART PAGE WITH REMOVE FUNCTIONALITY */}
      {activeTab === 'cart' && (
        <div style={{ marginTop: 24, maxWidth: 800, margin: '24px auto 0' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>Your Shopping Cart</h2>
          
          {!cart || cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #d1d5db', borderRadius: 8 }}>
              <p style={{ color: '#6b7280', fontSize: 16, margin: '0 0 16px' }}>Your cart is completely empty.</p>
              <button onClick={() => setActiveTab('home')} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Explore Products
              </button>
            </div>
          ) : (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 8px' }}>Product</th>
                    <th style={{ padding: '12px 8px' }}>Price</th>
                    <th style={{ padding: '12px 8px' }}>Quantity</th>
                    <th style={{ padding: '12px 8px' }}>Subtotal</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map(item => (
                    <tr key={item.itemId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>{item.productName}</td>
                      <td style={{ padding: '14px 8px' }}>₹{item.unitPrice}</td>
                      <td style={{ padding: '14px 8px' }}>{item.quantity}</td>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>₹{item.subtotal}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 18, borderTop: '2px solid #e5e7eb' }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>Grand Total:</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>₹{cart.totalAmount}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button onClick={() => setActiveTab('home')} style={{ padding: '10px 18px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Continue Shopping
                </button>
                <button onClick={() => setActiveTab('checkout')} style={{ padding: '10px 22px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
                  Proceed to Sandbox Checkout →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB C: SANDBOX PAYMENT GATEWAY CHECKOUT */}
      {activeTab === 'checkout' && (
        <div style={{ marginTop: 24, maxWidth: 650, margin: '24px auto 0' }}>
          <div style={{ border: '2px solid #3b82f6', borderRadius: 10, padding: 28, background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e40af' }}>
                💳 Sandbox Payment Gateway
              </h2>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                TEST ENVIRONMENT
              </span>
            </div>

            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
              Simulate actual card authorization. No real money or real credit card is used.
            </p>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Order Total:</span>
                <strong>₹{cart?.totalAmount || '0.00'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Items:</span>
                <span>{totalCartItems} total</span>
              </div>
            </div>

            {/* Simulated Card Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Dummy Card Number</label>
                <input 
                  type="text" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Expiry Date</label>
                  <input 
                    type="text" 
                    value={cardExpiry} 
                    onChange={(e) => setCardExpiry(e.target.value)} 
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>CVV</label>
                  <input 
                    type="text" 
                    value={cardCvv} 
                    onChange={(e) => setCardCvv(e.target.value)} 
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Sandbox Gateway Result Decision */}
              <div style={{ marginTop: 10, padding: 14, background: '#fef3c7', borderRadius: 6, border: '1px solid #fde68a' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                  ⚙️ Select Sandbox Transaction Outcome:
                </label>
                <select 
                  value={sandboxOutcome} 
                  onChange={(e) => setSandboxOutcome(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                >
                  <option value="SUCCESS">Simulate Successful Authorization (Status: PAID)</option>
                  <option value="FAILED">Simulate Declined Transaction (Status: CANCELLED)</option>
                </select>
              </div>
            </div>

            <button
              disabled={isProcessingPayment}
              onClick={submitSandboxPayment}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 6,
                border: 'none',
                background: isProcessingPayment ? '#9ca3af' : sandboxOutcome === 'SUCCESS' ? '#16a34a' : '#dc2626',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: isProcessingPayment ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessingPayment 
                ? 'Communicating with Gateway...' 
                : sandboxOutcome === 'SUCCESS' ? `Authorize Payment (₹${cart?.totalAmount})` : `Simulate Decline (₹${cart?.totalAmount})`}
            </button>
          </div>
        </div>
      )}

      {/* TAB D: ORDERS HISTORY PAGE */}
      {activeTab === 'orders' && (
        <div style={{ marginTop: 24, maxWidth: 900, margin: '24px auto 0' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>Your Orders</h2>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #d1d5db', borderRadius: 8 }}>
              <p style={{ color: '#6b7280', fontSize: 16 }}>No orders placed yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map(order => (
                <div key={order.orderId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
                    <div>
                      <strong style={{ fontSize: 16 }}>Order #{order.orderId}</strong>
                      <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12 }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 13,
                      background: order.status === 'PAID' ? '#dcfce7' : order.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                      color: order.status === 'PAID' ? '#15803d' : order.status === 'CANCELLED' ? '#b91c1c' : '#b45309'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: '12px 0', margin: 0 }}>
                    {order.items.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                        <span>{item.productName} × {item.quantity}</span>
                        <strong>₹{item.subtotal}</strong>
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Total: ₹{order.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB E: LOGIN */}
      {activeTab === 'login' && (
        <div style={{ maxWidth: 400, margin: '40px auto 0', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, background: '#fff' }}>
          <h2 style={{ textAlign: 'center', margin: '0 0 20px' }}>Sign In</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <button type="submit" style={{ padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
              Sign In
            </button>
          </form>
          <button onClick={() => setActiveTab('register')} style={{ marginTop: 16, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', width: '100%', fontSize: 13 }}>
            Don't have an account? Register here
          </button>
        </div>
      )}

      {/* TAB F: REGISTER */}
      {activeTab === 'register' && (
        <div style={{ maxWidth: 400, margin: '40px auto 0', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, background: '#fff' }}>
          <h2 style={{ textAlign: 'center', margin: '0 0 20px' }}>Create an Account</h2>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <button type="submit" style={{ padding: 12, background: '#111827', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
              Register
            </button>
          </form>
          <button onClick={() => setActiveTab('login')} style={{ marginTop: 16, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', width: '100%', fontSize: 13 }}>
            Already have an account? Sign In
          </button>
        </div>
      )}

    </div>
  );
}