// src/services/api.js
import axios from 'axios';

class ApiService {
  constructor() {
    this.api = axios.create({
    //   baseURL: process.env.REACT_APP_API_URL || '/api',
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true // Important for cookies
    });
    
    this.csrfToken = null;
    this.init();
  }
  
  async init() {
    await this.fetchCsrfToken();
    
    // Add CSRF token to all requests
    this.api.interceptors.request.use((config) => {
      if (this.csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
        config.headers['X-CSRF-Token'] = this.csrfToken;
      }
      return config;
    });
    
    // Handle 401 responses
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  async fetchCsrfToken() {
    try {
      const response = await axios.get('/api/csrf-token', {
        withCredentials: true
      });
      this.csrfToken = response.data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  
  get(url, config = {}) {
    return this.api.get(url, config);
  }
  
  post(url, data, config = {}) {
    return this.api.post(url, data, config);
  }
  
  put(url, data, config = {}) {
    return this.api.put(url, data, config);
  }
  
  delete(url, config = {}) {
    return this.api.delete(url, config);
  }
}

export const api = new ApiService();