// API Configuration - Vercel Ready
export const API_URL = import.meta.env.VITE_API_URL || 'https://illegal-jacinta-mkrrn-d8f0167d.koyeb.app/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://illegal-jacinta-mkrrn-d8f0167d.koyeb.app';

// App Configuration
export const SHOP_NAME = 'Public Koffiee';
export const SHOP_TAGLINE = 'Premium Dark Roast Since 2024';

// Features
export const TAX_PERCENTAGE = 10;
export const CURRENCY = 'IDR';

// Order Statuses
export const ORDER_STATUSES = {
    pending: { label: 'Menunggu', color: 'orange' },
    confirmed: { label: 'Dikonfirmasi', color: 'blue' },
    preparing: { label: 'Diproses', color: 'blue' },
    ready: { label: 'Siap', color: 'emerald' },
    served: { label: 'Disajikan', color: 'emerald' },
    completed: { label: 'Selesai', color: 'emerald' },
    cancelled: { label: 'Dibatalkan', color: 'red' }
};

// Payment Statuses
export const PAYMENT_STATUSES = {
    pending: { label: 'Belum Bayar', color: 'orange' },
    paid: { label: 'Lunas', color: 'emerald' },
    failed: { label: 'Gagal', color: 'red' },
    refunded: { label: 'Refund', color: 'slate' }
};

// Payment Methods
export const PAYMENT_METHODS = {
    cash: { label: 'Tunai', icon: '💵' },
    qris: { label: 'QRIS', icon: '📱' },
    debit: { label: 'Debit', icon: '💳' },
    credit: { label: 'Credit Card', icon: '💳' },
    transfer: { label: 'Transfer', icon: '🏦' },
    ewallet: { label: 'E-Wallet', icon: '📲' }
};

// Order Types
export const ORDER_TYPES = {
    'dine-in': { label: 'Makan di Tempat', icon: '🍽️' },
    'takeaway': { label: 'Bawa Pulang', icon: '🥡' },
    'delivery': { label: 'Delivery', icon: '🛵' },
    'online': { label: 'Pesanan Online', icon: '🌐' }
};

// Format helpers
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

export const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

export const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
};
