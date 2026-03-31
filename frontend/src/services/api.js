import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getUsers = () => api.get('/auth/users');
export const createUser = (data) => api.post('/auth/users', data);

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const getLowStock = () => api.get('/products/low-stock');
export const getProductBarcode = (id) => api.get(`/products/${id}/barcode`);
export const getByBarcode = (barcode) => api.get(`/products/barcode/${barcode}`);

// Inventory
export const getDashboard = () => api.get('/inventory/dashboard');
export const adjustStock = (id, data) => api.post(`/inventory/products/${id}/adjust`, data);
export const getMovements = (id) => api.get(`/inventory/products/${id}/movements`);
export const getEOQ = (id, params) => api.get(`/inventory/products/${id}/eoq`, { params });

// Orders
export const getOrders = (status) => api.get('/orders', { params: status ? { status } : {} });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const approveOrder = (id) => api.patch(`/orders/${id}/approve`);
export const receiveOrder = (id) => api.patch(`/orders/${id}/receive`);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);

// AI
export const aiChat = (message) => api.post('/ai/chat', { message });
export const getForecast = () => api.get('/ai/forecast');
export const getAlerts = () => api.get('/ai/alerts');
export const markAlertRead = (id) => api.patch(`/ai/alerts/${id}/read`);
export const getUnreadCount = () => api.get('/ai/alerts/unread-count');

export default api;
