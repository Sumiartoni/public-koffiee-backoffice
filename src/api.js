import axios from 'axios';
import { API_URL } from './config.js';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000 // 10 seconds
});

// Add auth token to all requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// =============================================
// AUTH API
// =============================================
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    sendOTP: (username, type) => api.post('/auth/send-otp', { username, type }),
    verifyOTP: (username, otp) => api.post('/auth/verify-otp', { username, otp }),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data)
};

// =============================================
// MENU API
// =============================================
export const menuAPI = {
    getAll: () => api.get('/menu'),
    getAdminAll: () => api.get('/menu/admin/all'),
    getById: (id) => api.get(`/menu/${id}`),
    create: (formData) => api.post('/menu', formData),
    update: (id, formData) => api.put(`/menu/${id}`, formData),
    updateHPP: (id, hpp, hppType) => api.patch(`/menu/${id}/hpp`, { hpp, hpp_type: hppType }),
    delete: (id) => api.delete(`/menu/${id}`),
    getCategories: () => api.get('/menu/categories/all'),
    createCategory: (data) => api.post('/menu/categories', data),
    updateCategory: (id, data) => api.put(`/menu/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/menu/categories/${id}`)
};

// =============================================
// ORDER API
// =============================================
export const orderAPI = {
    getAll: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    updatePayment: (id, data) => api.patch(`/orders/${id}/payment`, data),
    delete: (id) => api.delete(`/orders/${id}`),
    getPending: () => api.get('/orders/stats/pending'),
    getToday: () => api.get('/orders/stats/today')
};

// =============================================
// EXPENSE API
// =============================================
export const expenseAPI = {
    getAll: (params) => api.get('/expenses', { params }),
    getById: (id) => api.get(`/expenses/${id}`),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
    getCategories: () => api.get('/expenses/categories/all'),
    createCategory: (data) => api.post('/expenses/categories', data),
    getDailySummary: (date) => api.get('/expenses/summary/daily', { params: { date } })
};

// =============================================
// INGREDIENT & RECIPE API
// =============================================
export const ingredientAPI = {
    getAll: () => api.get('/ingredients'),
    getById: (id) => api.get(`/ingredients/${id}`),
    create: (data) => api.post('/ingredients', data),
    update: (id, data) => api.put(`/ingredients/${id}`, data),
    delete: (id) => api.delete(`/ingredients/${id}`),
    updateStock: (id, data) => api.patch(`/ingredients/${id}/stock`, data),
    getLowStock: () => api.get('/ingredients/alerts/low-stock'),
    // Recipes
    getRecipe: (menuItemId) => api.get(`/ingredients/recipe/${menuItemId}`),
    setRecipe: (menuItemId, data) => api.post(`/ingredients/recipe/${menuItemId}`, data),
    deleteRecipe: (menuItemId) => api.delete(`/ingredients/recipe/${menuItemId}`),
    recalculateAllHPP: () => api.post('/ingredients/recipe/recalculate-all')
};

// =============================================
// REPORT API
// =============================================
export const reportAPI = {
    getDashboard: () => api.get('/reports/dashboard'),
    getAdvanced: (start, end) => api.get('/reports/advanced', { params: { start, end } }),
    getBreakdown: (type, start, end) => api.get(`/reports/breakdown/${type}`, { params: { start, end } }),
    getCustomers: () => api.get('/reports/customers'),
    getVariants: (start, end) => api.get('/reports/variants', { params: { start, end } })
};

// =============================================
// RECEIPT API
// =============================================
export const receiptAPI = {
    getAll: () => api.get('/receipts'),
    getDefault: () => api.get('/receipts/default'),
    getById: (id) => api.get(`/receipts/${id}`),
    create: (data) => api.post('/receipts', data),
    update: (id, data) => api.put(`/receipts/${id}`, data),
    setDefault: (id) => api.patch(`/receipts/${id}/set-default`),
    delete: (id) => api.delete(`/receipts/${id}`),
    preview: (templateId) => api.post('/receipts/preview', { template_id: templateId })
};

// =============================================
// SETTINGS API
// =============================================
export const settingsAPI = {
    getAll: () => api.get('/settings'),
    update: (data) => api.put('/settings', data),
    get: (key) => api.get(`/settings/${key}`)
};

// =============================================
// PROMO & DISCOUNT API
// =============================================
export const promoAPI = {
    getPromotions: () => api.get('/promos/promotions'),
    createPromotion: (data) => api.post('/promos/promotions', data),
    updatePromotion: (id, data) => api.put(`/promos/promotions/${id}`, data),
    deletePromotion: (id) => api.delete(`/promos/promotions/${id}`),
    getDiscounts: () => api.get('/promos/discounts'),
    createDiscount: (data) => api.post('/promos/discounts', data),
    updateDiscount: (id, data) => api.put(`/promos/discounts/${id}`, data),
    deleteDiscount: (id) => api.delete(`/promos/discounts/${id}`)
};

// =============================================
// EXTRA API
// =============================================
export const extraAPI = {
    getAll: () => api.get('/extras'),
    create: (data) => api.post('/extras', data),
    update: (id, data) => api.put(`/extras/${id}`, data),
    delete: (id) => api.delete(`/extras/${id}`),
    linkToMenuItem: (menuItemId, extraIds) => api.post(`/extras/menu-item/${menuItemId}`, { extraIds }),
    getByMenuItem: (menuItemId) => api.get(`/extras/menu-item/${menuItemId}`)
};

export default api;
