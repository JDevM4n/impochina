const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3301';

class SourcingApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }
async request(endpoint, options = {}) {
  const url = `${this.baseURL}${endpoint}`;
  
  // Configurar headers con autenticación
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Agregar token si está disponible
  if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;
    console.log('🔐 [sourcingApi] Authorization header added');
  }

  console.log('🌐 [sourcingApi] Full URL:', url);
  console.log('📋 [sourcingApi] Headers:', headers);
  console.log('📦 [sourcingApi] Body:', options.body);

  const config = {
    headers,
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  console.log(`🔄 [sourcingApi] API Call: ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    
    console.log(`📡 [sourcingApi] Response status: ${response.status} for ${url}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [sourcingApi] HTTP error! status: ${response.status}`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [sourcingApi] API Success:`, data);
    return data;
  } catch (error) {
    console.error('❌ [sourcingApi] API request failed:', error);
    throw error;
  }
}

  async createPurchaseRequest(urls) {
    if (typeof urls === 'string') {
      urls = [urls];
    }
    console.log('📦 Creating purchase request for URLs:', urls);
    return this.request('/purchase-requests', {
      method: 'POST',
      body: { urls },
    });
  }

  async getPurchaseRequestStatus(requestId) {
    console.log('📊 Getting status for request:', requestId);
    return this.request(`/purchase-requests/${requestId}`);
  }

  async getPurchaseRequestResults(requestId) {
    console.log('📋 Getting results for request:', requestId);
    return this.request(`/purchase-requests/${requestId}/results`);
  }

  // Nuevos métodos para el carrito
  async addToCart(product) {
  console.log('🛒 [sourcingApi] Adding to cart:', product);
  console.log('🔑 [sourcingApi] Token:', this.token ? 'Present' : 'Missing');
  
  return this.request('/cart/items', {
    method: 'POST',
    body: { product },
  });
}

  async getCartItems() {
    console.log('📦 Getting cart items');
    return this.request('/cart/items');
  }

  async removeFromCart(cartItemId) {
    console.log('🗑️ Removing from cart:', cartItemId);
    return this.request(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
  }

  async checkout() {
    console.log('💰 Processing checkout');
    return this.request('/cart/checkout', {
      method: 'POST',
    });
  }

  async clearCart() {
    console.log('🧹 Clearing cart');
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}
a

export const sourcingApi = new SourcingApiService();