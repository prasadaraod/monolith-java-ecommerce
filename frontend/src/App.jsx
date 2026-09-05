import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [paymentMode, setPaymentMode] = useState('SUCCESS');

  useEffect(() => {
    fetchProducts();
    if (token) {
      fetchUserProfile();
      fetchCart();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/products`);
      setProducts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUser(await res.json());
      else logout();
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

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    const payload = isRegistering ? { fullName, email, password } : { email, password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({ email: data.email, fullName: data.fullName, role: data.role });
      setMessage('Welcome, ' + data.fullName);
    } catch (err) {
      setMessage(err.message);
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

      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordModal(false);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setCart(null);
    setShowPasswordModal(false);
  };

  const addToCart = async (productId) => {
    if (!token) return setMessage('Please log in first.');
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
        setMessage('Added item to cart.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ simulation: paymentMode })
      });
      const order = await res.json();

      if (res.ok) {
        if (order.status === 'PAID') {
          setMessage(`Payment Successful! Order #${order.orderId} placed.`);
        } else {
          setMessage(`Payment Failed! Order #${order.orderId} was marked as CANCELLED.`);
        }
        fetchCart();
        fetchProducts();
      } else {
        setMessage(order.message || 'Checkout failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 1200, margin: '0 auto', padding: '24px 20px', color: '#1f2937' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Java Monolith Store</h2>
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14 }}>Hello, <strong>{user.fullName}</strong> ({user.role})</span>
              <button 
                onClick={() => setShowPasswordModal(!showPasswordModal)} 
                style={{ padding: '6px 12px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                Change Password
              </button>
              <button 
                onClick={logout} 
                style={{ padding: '6px 12px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                Logout
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 14, color: '#6b7280' }}>Guest</span>
          )}
        </div>
      </header>

      {message && (
        <div style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '12px 16px', margin: '20px 0', borderRadius: 6, fontSize: 14, textAlign: 'center' }}>
          {message}
        </div>
      )}

      {showPasswordModal && user && (
        <div style={{ border: '1px solid #93c5fd', background: '#f0fdf4', borderRadius: 8, padding: 16, margin: '20px 0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 15 }}>Change Account Password</h4>
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
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500 }}>
              Update Password
            </button>
            <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '8px 14px', cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6 }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Main layout: 1fr for product area, rigid 340px for aside */}
      <main style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32, marginTop: 24, alignItems: 'start' }}>
        <section>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Product Catalog</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {products.map(p => (
              <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fff' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 600 }}>{p.name}</h4>
                  <p style={{ color: '#6b7280', fontSize: 13, minHeight: 38, margin: '0 0 12px 0' }}>{p.description}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>
                    <strong style={{ fontSize: 16 }}>₹{p.price}</strong> <span style={{ color: '#6b7280' }}>| Stock: {p.stockQuantity}</span>
                  </p>
                  <button
                    disabled={p.stockQuantity < 1}
                    onClick={() => addToCart(p.id)}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: p.stockQuantity > 0 ? '#f9fafb' : '#f3f4f6',
                      color: p.stockQuantity > 0 ? '#111827' : '#9ca3af',
                      cursor: p.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                      fontWeight: 500,
                      fontSize: 13
                    }}
                  >
                    {p.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside style={{ width: '100%', position: 'sticky', top: 20 }}>
          {!token ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, background: '#fff' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, textAlign: 'center' }}>{isRegistering ? 'Register' : 'Login'}</h3>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {isRegistering && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                  />
                )}
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
                <button type="submit" style={{ padding: 10, cursor: 'pointer', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500 }}>
                  {isRegistering ? 'Sign Up' : 'Log In'}
                </button>
              </form>
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                style={{ marginTop: 12, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', width: '100%', fontSize: 13 }}
              >
                {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
            </div>
          ) : (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, background: '#fff' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, textAlign: 'center' }}>Your Cart</h3>
              {cart && cart.items.length > 0 ? (
                <>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {cart.items.map(item => (
                      <li key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                        <span>{item.productName} x {item.quantity}</span>
                        <strong>₹{item.subtotal}</strong>
                      </li>
                    ))}
                  </ul>
                  <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 15 }}>Total:</span>
                    <strong style={{ fontSize: 16 }}>₹{cart.totalAmount}</strong>
                  </div>

                  <div style={{ margin: '16px 0', padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                      Mock Payment Status:
                    </label>
                    <select 
                      value={paymentMode} 
                      onChange={(e) => setPaymentMode(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                    >
                      <option value="SUCCESS">Simulate Success (PAID)</option>
                      <option value="FAILED">Simulate Failure (CANCEL)</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleCheckout} 
                    style={{ 
                      width: '100%', 
                      padding: 12, 
                      background: paymentMode === 'SUCCESS' ? '#16a34a' : '#dc2626', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 6, 
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    {paymentMode === 'SUCCESS' ? 'Pay & Checkout' : 'Trigger Failed Payment'}
                  </button>
                </>
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', margin: '20px 0', fontSize: 14 }}>Your cart is empty.</p>
              )}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}