/**
 * Оптимизация API для работы с большими данными
 * Включает кэширование, пагинацию, дебаунсинг и батчинг запросов
 */

// Кэш для API запросов
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 минут

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new APICache();

// Дебаунсинг для поисковых запросов
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttling для ограничения частоты запросов
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Батчинг запросов
interface BatchRequest {
  id: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RequestBatcher {
  private queue: BatchRequest[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // мс

  add<T>(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.BATCH_DELAY);
      }
    });
  }

  private async flush() {
    const requests = [...this.queue];
    this.queue = [];
    this.timer = null;

    if (requests.length === 0) return;

    // Группируем запросы по типу
    const grouped = requests.reduce((acc, req) => {
      const [type] = req.id.split(':');
      if (!acc[type]) acc[type] = [];
      acc[type].push(req);
      return acc;
    }, {} as Record<string, BatchRequest[]>);

    // Выполняем батч-запросы
    for (const [type, reqs] of Object.entries(grouped)) {
      try {
        const ids = reqs.map(r => r.id.split(':')[1]);
        // TODO: Реализовать батч-запросы к API
        // const results = await apiBatchFetch(type, ids);
        // reqs.forEach((req, i) => req.resolve(results[i]));
      } catch (error) {
        reqs.forEach(req => req.reject(error));
      }
    }
  }
}

export const requestBatcher = new RequestBatcher();

// Пагинация для больших списков
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export function paginateArray<T>(
  array: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const { page, pageSize } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = array.slice(start, end);
  const total = array.length;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

// Виртуализация списков - хелпер для расчета видимых элементов
export interface VirtualListParams {
  totalItems: number;
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
  overscan?: number;
}

export interface VirtualListResult {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  visibleItems: number;
}

export function calculateVirtualList(
  params: VirtualListParams
): VirtualListResult {
  const { totalItems, itemHeight, containerHeight, scrollTop, overscan = 3 } = params;

  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleItems + overscan * 2
  );
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    offsetY,
    visibleItems,
  };
}

// Оптимизация изображений - ленивая загрузка
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });

    if (placeholder) {
      img.src = placeholder;
    }
    observer.observe(img);
  } else {
    // Fallback для старых браузеров
    img.src = src;
  }
}

// Сжатие данных перед отправкой
export async function compressData(data: any): Promise<string> {
  const json = JSON.stringify(data);
  
  // Используем CompressionStream API если доступен
  if ('CompressionStream' in window) {
    const stream = new Blob([json]).stream();
    const compressedStream = stream.pipeThrough(
      new (window as any).CompressionStream('gzip')
    );
    const compressedBlob = await new Response(compressedStream).blob();
    const arrayBuffer = await compressedBlob.arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  }

  // Fallback: простое base64 кодирование
  return btoa(json);
}

// Декомпрессия данных
export async function decompressData(compressed: string): Promise<any> {
  if ('DecompressionStream' in window) {
    const binaryString = atob(compressed);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const stream = new Blob([bytes]).stream();
    const decompressedStream = stream.pipeThrough(
      new (window as any).DecompressionStream('gzip')
    );
    const decompressedBlob = await new Response(decompressedStream).blob();
    const text = await decompressedBlob.text();
    return JSON.parse(text);
  }

  // Fallback
  const json = atob(compressed);
  return JSON.parse(json);
}

// Оптимизированный fetch с повторными попытками
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }

      // Не повторяем для клиентских ошибок (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        // Экспоненциальная задержка
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

// Prefetching для предзагрузки данных
export class DataPrefetcher {
  private prefetchQueue: Set<string> = new Set();
  private prefetchedData: Map<string, any> = new Map();

  async prefetch(key: string, fetcher: () => Promise<any>) {
    if (this.prefetchQueue.has(key) || this.prefetchedData.has(key)) {
      return;
    }

    this.prefetchQueue.add(key);

    try {
      const data = await fetcher();
      this.prefetchedData.set(key, data);
    } catch (error) {
      console.error(`Prefetch failed for ${key}:`, error);
    } finally {
      this.prefetchQueue.delete(key);
    }
  }

  get(key: string): any | null {
    return this.prefetchedData.get(key) || null;
  }

  clear() {
    this.prefetchedData.clear();
    this.prefetchQueue.clear();
  }
}

export const dataPrefetcher = new DataPrefetcher();

// Мониторинг производительности
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  start(label: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      this.metrics.get(label)!.push(duration);

      // Логируем медленные операции
      if (duration > 1000) {
        console.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  getStats(label: string) {
    const durations = this.metrics.get(label) || [];
    if (durations.length === 0) return null;

    const sorted = [...durations].sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return {
      count: durations.length,
      avg: avg.toFixed(2),
      median: median.toFixed(2),
      p95: p95.toFixed(2),
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2),
    };
  }

  clear() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

