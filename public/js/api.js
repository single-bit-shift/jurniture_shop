const API_BASE_URL = '/api';

const api = {
    // Auth
    register: async (name, email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        return res.json();
    },
    login: async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },
    adminLogin: async (email, password, passkey) => {
        const res = await fetch(`${API_BASE_URL}/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, passkey })
        });
        return res.json();
    },
    // Products
    getProducts: async (category = '', search = '') => {
        let url = `${API_BASE_URL}/products?`;
        if (category) url += `category=${category}&`;
        if (search) url += `search=${search}`;
        const res = await fetch(url);
        return res.json();
    },
    getProductById: async (id) => {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        return res.json();
    },
    createProduct: async (formData, token) => {
        const res = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return res.json();
    },
    deleteProduct: async (id, token) => {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },
    updateProduct: async (id, formData, token) => {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return res.json();
    },
    // Categories
    getCategories: async () => {
        const res = await fetch(`${API_BASE_URL}/categories`);
        return res.json();
    },
    createCategory: async (categoryData, token) => {
        const res = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData)
        });
        return res.json();
    },
    deleteCategory: async (id, token) => {
        const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },
    // Orders
    createOrder: async (orderData, token) => {
        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(orderData)
        });
        return res.json();
    },
    getMyOrders: async (token) => {
        const res = await fetch(`${API_BASE_URL}/orders/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },
    getAdminOrders: async (token, status = '') => {
        let url = `${API_BASE_URL}/orders?`;
        if (status) url += `status=${status}`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },
    updateOrderStatus: async (id, status, token) => {
        const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status })
        });
        return res.json();
    },
    // Inquiries
    createInquiry: async (inquiryData, token) => {
        const res = await fetch(`${API_BASE_URL}/inquiries`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(inquiryData)
        });
        return res.json();
    },
    getAdminInquiries: async (token) => {
        const res = await fetch(`${API_BASE_URL}/inquiries`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },
    // Auth Enhancements
    changePassword: async (currentPassword, newPassword, token) => {
        const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return res.json();
    },
    // Invoice
    getInvoiceUrl: (orderId) => {
        return `${API_BASE_URL}/orders/${orderId}/invoice`;
    }
};


