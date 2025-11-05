// src/api/Service2.js - Versión con mock
import { apiFetch, getOrdersBase } from './apiService';

const ORDERS_BASE = getOrdersBase();
const USE_MOCK = true; // Cambiar a false cuando arregles la autenticación

// Mock data para desarrollo
const mockOrders = [
  {
    id: "1",
    userId: "usuario1",
    productName: "Auriculares Bluetooth",
    quantity: 2,
    shippingPrice: 15000,
    totalPrice: 45000,
    createdAt: new Date().toISOString(),
    scrapedData: {
      originalUrl: "https://item.taobao.com/item.htm?id=677904588313",
      originalTitle: "无线蓝牙耳机5.0降噪",
      priceCNY: 158.00,
      priceUSD: 22.12,
      currency: "CNY",
      image: "https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Auriculares+Bluetooth"
    }
  },
  {
    id: "2", 
    userId: "usuario1",
    productName: "Teclado Mecánico",
    quantity: 1,
    shippingPrice: 12000,
    totalPrice: 32000,
    createdAt: new Date().toISOString()
  }
];

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.orders && Array.isArray(data.orders)) return data.orders;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

// Función mock
async function mockApiCall(endpoint, options = {}) {
  console.log('🔄 Mock API Call:', endpoint, options);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (endpoint === '/orders/me' && options.method === 'GET') {
    return mockOrders;
  }
  
  if (endpoint === '/orders' && options.method === 'POST') {
    const newOrder = {
      id: `mock-${Date.now()}`,
      userId: "usuario1",
      productName: options.body.productName,
      quantity: options.body.quantity,
      shippingPrice: options.body.shippingPrice,
      totalPrice: options.body.shippingPrice + 10000,
      createdAt: new Date().toISOString(),
      scrapedData: options.body.scrapedData || null
    };
    mockOrders.unshift(newOrder);
    return newOrder;
  }
  
  return { message: 'Mock endpoint not implemented' };
}

export async function getMyOrders(token) {
  if (USE_MOCK) {
    return mockApiCall('/orders/me', { method: 'GET' });
  }
  
  try {
    const data = await apiFetch(ORDERS_BASE, '/orders/me', { token });
    return normalizeList(data);
  } catch (error) {
    console.error('Error real API, usando mock:', error);
    return mockApiCall('/orders/me', { method: 'GET' });
  }
}

export async function createOrder(token, body) {
  if (USE_MOCK) {
    return mockApiCall('/orders', { method: 'POST', body });
  }
  
  try {
    const data = await apiFetch(ORDERS_BASE, '/orders', {
      method: 'POST',
      token,
      body,
    });
    return data?.order ?? data;
  } catch (error) {
    console.error('Error real API, usando mock:', error);
    return mockApiCall('/orders', { method: 'POST', body });
  }
}

export async function saveScrapedProduct(token, productData) {
  const body = {
    productName: productData.title,
    quantity: 1,
    shippingPrice: productData.priceUSD ? Math.max(10000, productData.priceUSD * 500) : 15000,
    scrapedData: {
      originalUrl: productData.url,
      originalTitle: productData.title_zh || productData.title,
      priceCNY: productData.priceCNY,
      priceUSD: productData.priceUSD,
      currency: productData.currency,
      image: productData.image
    }
  };

  return createOrder(token, body);
}