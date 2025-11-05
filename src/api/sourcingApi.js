const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3301';

class SourcingApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    console.log(`🔄 API Call: ${config.method || 'GET'} ${url}`, config.body);

    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status} for ${url}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
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

  async healthCheck() {
    return this.request('/health');
  }
}

export const sourcingApi = new SourcingApiService();