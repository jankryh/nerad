// 🏗️ Základní API služba pro modulární architekturu

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiCache } from '../../utils/cache';
import { API_BASE_URL, API_KEY } from '../../constants';

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
  cached?: boolean;
}

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  cacheTTL: number;
}

export abstract class BaseAPIService {
  protected api: AxiosInstance;
  protected config: APIConfig;
  protected cache: typeof apiCache;

  constructor(config: Partial<APIConfig> = {}) {
    this.config = {
      baseURL: API_BASE_URL,
      timeout: 10000,
      retries: 3,
      cacheTTL: 30000,
      ...config
    };

    this.api = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.cache = apiCache;
    this.setupInterceptors();
  }

  /**
   * Nastaví interceptory pro request/response
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Přidání API klíče jen v legacy režimu bez proxy.
        if (API_KEY) {
          config.headers.set('X-Access-Token', API_KEY);
        }
        
        // Logování requestů
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error('❌ Response Error:', error);
        
        // Retry logika
        if (error.config && !error.config._retry) {
          error.config._retry = true;
          return this.retryRequest(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Retry logika pro failed requesty
   */
  private async retryRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    for (let i = 0; i < this.config.retries; i++) {
      try {
        console.log(`🔄 Retry attempt ${i + 1}/${this.config.retries}`);
        return await this.api.request(config);
      } catch (error) {
        if (i === this.config.retries - 1) {
          throw error;
        }
        // Počkat před dalším pokusem
        await this.delay(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Delay funkce pro retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request s cache podporou
   */
  protected async get<T>(
    url: string, 
    config?: AxiosRequestConfig, 
    cacheKey?: string,
    useCache: boolean = true
  ): Promise<APIResponse<T>> {
    
    // Zkusit cache
    if (useCache && cacheKey) {
      const cachedData = this.cache.get<T>(cacheKey);
      if (cachedData) {
        console.log(`🗄️ Cache hit: ${cacheKey}`);
        return {
          data: cachedData,
          status: 200,
          cached: true
        };
      }
    }

    try {
      const response = await this.api.get<T>(url, config);
      
      // Uložit do cache
      if (useCache && cacheKey) {
        this.cache.set(cacheKey, response.data, this.config.cacheTTL);
        console.log(`💾 Cached: ${cacheKey}`);
      }

      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`❌ GET Error for ${url}:`, error);
      throw error;
    }
  }

  /**
   * POST request
   */
  protected async post<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`❌ POST Error for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Batch request pro více API volání
   */
  protected async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    maxConcurrent: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    const chunks = this.chunkArray(requests, maxConcurrent);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(chunk.map(req => req()));
      
      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Batch request failed:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Rozdělí array na chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Získá cache statistiku
   */
  public getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Vyčistí cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Zastaví službu a vyčistí cache
   */
  public destroy(): void {
    this.cache.destroy();
  }
}
