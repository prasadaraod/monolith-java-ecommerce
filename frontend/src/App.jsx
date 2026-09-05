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

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
      const data = await res.json();
      setProducts(data);
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

  const checkout = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/orders/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const order = await res.json();
        setMessage(`Order #${order.orderId} placed successfully!`);
        fetchCart();
        fetchProducts();
      } else {
        const err = await res.json();
        setMessage(err.message || 'Checkout failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: 15 }}>
        <h2 style={{ margin: 0 }}>Cloud Monolith Store</h2>
        <div>
          {user ? (
            <div>
              <span>Hello, <strong>{user.fullName}</strong> ({user.role}) </span>
              <button 
                onClick={() => setShowPasswordModal(!showPasswordModal)} 
                style={{ marginLeft: 10, cursor: 'pointer', padding: '4px 8px' }}
              >
                Change Password
              </button>
              <button 
                onClick={logout} 
                style={{ marginLeft: 8, cursor: 'pointer', padding: '4px 8px' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <span>Guest</span>
          )}
        </div>
      </header>

      {message && (
        <div style={{ background: '#eef', padding: 10, margin: '15px 0', borderRadius: 4 }}>
          {message}
        </div>
      )}

      {showPasswordModal && user && (
        <div style={{ border: '1px solid #0066cc', background: '#f8fafd', borderRadius: 6, padding: 15, margin: '15px 0' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Change Account Password</h4>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="Current Password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ padding: 8, minWidth: 180 }}
            />
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ padding: 8, minWidth: 180 }}
            />
            <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer', background: '#0066cc', color: '#fff', border: 'none', borderRadius: 4 }}>
              Update Password
            </button>
            <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '8px 12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 30, marginTop: 20 }}>
        <section>
          <h3>Product Catalog</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
            {products.map(p => (
              <div key={p.id} style={{ border: '1px solid #ccc', borderRadius: 6, padding: 15 }}>
                <h4 style={{ margin: '0 0 8px 0' }}>{p.name}</h4>
                <p style={{ color: '#666', fontSize: 13 }}>{p.description}</p>
                <p><strong>₹{p.price}</strong> | Stock: {p.stockQuantity}</p>
                <button
                  disabled={p.stockQuantity < 1}
                  onClick={() => addToCart(p.id)}
                  style={{ width: '100%', padding: '8px 0', cursor: 'pointer' }}
                >
                  {p.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside>
          {!token ? (
            <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 15 }}>
              <h3>{isRegistering ? 'Register' : 'Login'}</h3>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isRegistering && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ padding: 8 }}
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: 8 }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: 8 }}
                />
                <button type="submit" style={{ padding: 10, cursor: 'pointer' }}>
                  {isRegistering ? 'Sign Up' : 'Log In'}
                </button>
              </form>
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                style={{ marginTop: 10, background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer' }}
              >
                {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
            </div>
          ) : (
            <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 15 }}>
              <h3>Your Cart</h3>
              {cart && cart.items.length > 0 ? (
                <>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {cart.items.map(item => (
                      <li key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>{item.productName} x {item.quantity}</span>
                        <strong>₹{item.subtotal}</strong>
                      </li>
                    ))}
                  </ul>
                  <hr />
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0' }}>
                    <strong>Total:</strong>
                    <strong>₹{cart.totalAmount}</strong>
                  </div>
                  <button onClick={checkout} style={{ width: '100%', padding: 10, background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    Checkout Now
                  </button>
                </>
              ) : (
                <p>Your cart is empty.</p>
              )}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}