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

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setCart(null);
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
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: 15 }}>
        <h2>Cloud Monolith Store</h2>
        <div>
          {user ? (
            <div>
              <span>Hello, <strong>{user.fullName}</strong> ({user.role}) </span>
              <button onClick={logout} style={{ marginLeft: 10, cursor: 'pointer' }}>Logout</button>
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