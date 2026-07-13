import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Plus, Minus, Trash2, MapPin, User, Phone, X, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';

function App() {
  const tg = window.Telegram?.WebApp;
  
  // Telegram User Information
  const tgUser = tg?.initDataUnsafe?.user;
  const telegramId = tgUser?.id ? String(tgUser.id) : '12345678'; // fallback telegramId for testing
  const initialName = tgUser ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() : '';

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'orders'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: initialName,
    phone: '',
    address: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
    fetchProducts();
  }, []);

  // Fetch products from database
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (err) {
      console.error('Mahsulotlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user orders from database
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders/${telegramId}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Buyurtmalarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle active tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'orders') {
      fetchOrders();
    }
  };

  // Add to cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // Remove or decrease from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === productId);
      if (!existing) return prevCart;
      if (existing.quantity === 1) {
        return prevCart.filter((item) => item.product.id !== productId);
      }
      return prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  // Update item quantity directly
  const updateQuantity = (productId, amount) => {
    if (amount <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: amount } : item
      )
    );
  };

  // Calculate totals
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Submit Order to Backend
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Iltimos, barcha maydonlarni to‘ldiring.');
      return;
    }
    if (cart.length === 0) {
      alert('Savat bo‘sh!');
      return;
    }

    setSubmitting(true);
    const orderItems = cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    try {
      const payload = {
        telegramId,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        items: orderItems,
        totalAmount
      };

      await axios.post(`${API_URL}/api/orders`, payload);

      alert('Buyurtmangiz muvaffaqiyatli qabul qilindi!');
      
      // Reset cart and form
      setCart([]);
      setCheckoutOpen(false);

      // Close Telegram WebApp if inside Telegram
      if (tg) {
        tg.close();
      }
    } catch (err) {
      console.error('Buyurtma yuborishda xatolik:', err);
      alert('Buyurtma yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      setSubmitting(false);
    }
  };

  // Repeat Previous Order
  const handleRepeatOrder = (order) => {
    // order.items has structure: [{"id": 1, "name": "Margarita", "price": 50000, "quantity": 2}]
    // We need to map it back to products
    const repeatedCart = order.items.map((item) => {
      // Find the corresponding product from fetched products, or construct a mock product
      const foundProduct = products.find((p) => p.id === item.id) || {
        id: item.id,
        name: item.name,
        price: item.price,
        description: 'Tarixiy buyurtmadan tiklangan pitsa',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60'
      };
      return {
        product: foundProduct,
        quantity: item.quantity
      };
    });

    setCart(repeatedCart);
    setActiveTab('home');
    setCheckoutOpen(true); // Automatically open the confirmation/checkout page
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>Bari Pitsa 🍕</h1>
        {activeTab === 'home' && totalItemsCount > 0 && (
          <button className="qty-btn" onClick={() => setCheckoutOpen(true)} style={{ position: 'relative' }}>
            <ShoppingBag size={18} />
            <span style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: '#000',
              color: '#fff',
              borderRadius: '50%',
              fontSize: '10px',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifycontent: 'center',
              fontWeight: 'bold'
            }}>
              {totalItemsCount}
            </span>
          </button>
        )}
      </header>

      {/* Tabs Content */}
      <main style={{ flex: 1 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
            <RefreshCw size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && activeTab === 'home' && (
          <div className="product-grid">
            {products.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id);
              return (
                <div className="product-card" key={product.id}>
                  <img src={product.image} alt={product.name} className="product-image" />
                  <div className="product-info">
                    <div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">{product.price.toLocaleString()} so'm</span>
                      {cartItem ? (
                        <div className="quantity-controls">
                          <button className="qty-btn" onClick={() => removeFromCart(product.id)}>
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{cartItem.quantity}</span>
                          <button className="qty-btn" onClick={() => addToCart(product)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button className="btn-primary" onClick={() => addToCart(product)}>
                          Qo'shish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && activeTab === 'orders' && (
          <div className="orders-container">
            {orders.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">Buyurtmalar yo'q</p>
                <p style={{ fontSize: '13px' }}>Siz hali buyurtma bermagansiz. Hozir pitsa buyurtma qiling!</p>
                <button className="btn-primary" onClick={() => handleTabChange('home')} style={{ marginTop: '8px' }}>
                  Bosh sahifaga o'tish
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div className="order-card" key={order.id}>
                  <div className="order-header">
                    <span className="order-number">Buyurtma #{order.id}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</span>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div className="order-item-desc" key={idx}>
                        <span>{item.name} (x{item.quantity})</span>
                        <span>{(item.price * item.quantity).toLocaleString()} so'm</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <span>Jami summa:</span>
                    <span>{order.totalAmount.toLocaleString()} so'm</span>
                  </div>
                  <div className="order-footer">
                    <div className="order-address">📍 {order.address}</div>
                    <button className="btn-secondary" onClick={() => handleRepeatOrder(order)}>
                      Yana shundan buyurtma qilish 🍕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {activeTab === 'home' && totalItemsCount > 0 && (
        <button className="cart-floating-btn" onClick={() => setCheckoutOpen(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} /> Savatni ko'rish ({totalItemsCount})
          </span>
          <span>{totalAmount.toLocaleString()} so'm</span>
        </button>
      )}

      {/* Cart & Checkout Modal */}
      {checkoutOpen && (
        <div className="cart-overlay" onClick={() => setCheckoutOpen(false)}>
          <div className="cart-content" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Savat 🍕</h2>
              <button className="close-btn" onClick={() => setCheckoutOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p className="empty-state-title">Savat bo'sh</p>
                <p style={{ fontSize: '13px' }}>Savatingizga pitsa qo'shing</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.product.id}>
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.product.name}</div>
                        <div className="cart-item-price">
                          {item.product.price.toLocaleString()} so'm
                        </div>
                      </div>
                      <div className="quantity-controls">
                        <button className="qty-btn" onClick={() => removeFromCart(item.product.id)}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => addToCart(item.product)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-total" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <span>Jami summa:</span>
                  <span>{totalAmount.toLocaleString()} so'm</span>
                </div>

                <form className="checkout-form" onSubmit={handleCheckout}>
                  <div className="form-group">
                    <label htmlFor="client-name">
                      <User size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Ismingiz
                    </label>
                    <input
                      type="text"
                      id="client-name"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ismingizni kiriting"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="client-phone">
                      <Phone size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Telefon raqamingiz
                    </label>
                    <input
                      type="tel"
                      id="client-phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="client-address">
                      <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Yetkazib berish manzili
                    </label>
                    <input
                      type="text"
                      id="client-address"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ko'cha, uy, xonadon raqami"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '12px' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash 🍕'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <span style={{ fontSize: '18px' }}>🍕</span>
          <span>Bosh sahifa</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          <span style={{ fontSize: '18px' }}>📜</span>
          <span>Mening buyurtmalarim</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
