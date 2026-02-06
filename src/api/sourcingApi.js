// src/services/sourcingApi.js

const API_BASE_URL = 'http://localhost:3301'; // 🔧 Conexión directa al backend

class SourcingApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Guardar token de autenticación
  setToken(token) {
    this.token = token;
  }

  // Método general para peticiones
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('🔐 [sourcingApi] Token agregado al header');
    }

    const config = {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    console.log(`🌐 [sourcingApi] ${config.method} → ${url}`);
    console.log('📦 Body:', config.body);

    try {
      const response = await fetch(url, config);
      console.log(`📡 [sourcingApi] Estado: ${response.status}`);

      const text = await response.text();

      if (!response.ok) {
        console.error(`❌ [sourcingApi] Error HTTP ${response.status}:`, text);
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: text };
        }
        throw new Error(errorData.error || 'Error en la solicitud');
      }

      const data = JSON.parse(text);
      console.log('✅ [sourcingApi] Respuesta exitosa:', data);
      return data;
    } catch (error) {
      console.error('🚨 [sourcingApi] Falló la petición:', error.message);
      throw error;
    }
  }

  // Crear solicitud de compra
  async createPurchaseRequest(urls) {
    if (typeof urls === 'string') urls = [urls];
    console.log('🛍️ Creando solicitud de compra:', urls);

    return this.request('/purchase-requests', {
      method: 'POST',
      body: { urls },
    });
  }

  // Consultar estado de una solicitud
  async getPurchaseRequestStatus(requestId) {
    console.log('📊 Consultando estado:', requestId);
    return this.request(`/purchase-requests/${requestId}`);
  }

  // Consultar resultados
  async getPurchaseRequestResults(requestId) {
    console.log('📋 Consultando resultados:', requestId);
    return this.request(`/purchase-requests/${requestId}/results`);
  }

  // ----- 🛒 Funciones del carrito -----
  async addToCart(product) {
    console.log('🛒 Agregando al carrito:', product);
    return this.request('/cart/items', {
      method: 'POST',
      body: { product },
    });
  }

  async getCartItems() {
    console.log('📦 Obteniendo productos del carrito');
    return this.request('/cart/items');
  }

  async removeFromCart(cartItemId) {
    console.log('🗑️ Eliminando producto del carrito:', cartItemId);
    return this.request(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
  }

  async checkout() {
    console.log('💰 Procesando pago');
    return this.request('/cart/checkout', {
      method: 'POST',
    });
  }

  async clearCart() {
    console.log('🧹 Vaciando carrito');
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // ----- 🩺 Health Check -----
  async healthCheck() {
    console.log('💓 Verificando estado del servicio');
    return this.request('/health');
  }
}

export const sourcingApi = new SourcingApiService();
