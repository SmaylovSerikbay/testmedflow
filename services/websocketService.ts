/**
 * WebSocket сервис для обновлений в реальном времени
 * Обеспечивает мгновенную синхронизацию данных между всеми участниками
 */

export type WebSocketEventType = 
  | 'visit_created'
  | 'visit_started'
  | 'visit_updated'
  | 'examination_completed'
  | 'route_sheet_updated'
  | 'card_updated'
  | 'contract_created'
  | 'contract_updated'
  | 'doctor_created'
  | 'doctor_updated'
  | 'doctor_deleted'
  | 'user_connected'
  | 'user_disconnected';

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
  userId?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private handlers: Map<WebSocketEventType, Set<MessageHandler>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;

  /**
   * Подключение к WebSocket серверу
   */
  connect(userId: string, wsUrl?: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.userId = userId;
    this.isConnecting = true;

    // Используем wss:// для продакшена, ws:// для разработки
    const url = wsUrl || this.getWebSocketUrl(userId);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Отправляем идентификацию пользователя
        this.send({
          type: 'user_connected',
          data: { userId },
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Отключение от WebSocket
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Отправка сообщения через WebSocket
   */
  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  /**
   * Подписка на события
   */
  on(type: WebSocketEventType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Возвращаем функцию отписки
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  /**
   * Обработка входящих сообщений
   */
  private handleMessage(message: WebSocketMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in WebSocket handler for ${message.type}:`, error);
        }
      });
    }
  }

  /**
   * Попытка переподключения
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  /**
   * Получение URL WebSocket сервера
   */
  private getWebSocketUrl(userId?: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // Для разработки используем localhost:8080
    let baseUrl: string;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      baseUrl = `ws://localhost:8080/ws`;
    } else {
      baseUrl = `${protocol}//${host}/ws`;
    }
    
    // Добавляем userId в query параметры
    if (userId) {
      return `${baseUrl}?userId=${encodeURIComponent(userId)}`;
    }
    
    return baseUrl;
  }

  /**
   * Проверка состояния подключения
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Получение состояния подключения
   */
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}

// Экспортируем singleton instance
export const websocketService = new WebSocketService();

// Хелперы для отправки специфичных событий

/**
 * Уведомление о создании посещения
 */
export function broadcastVisitCreated(visitData: any) {
  websocketService.send({
    type: 'visit_created',
    data: visitData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Уведомление об обновлении посещения
 */
export function broadcastVisitUpdated(visitData: any) {
  websocketService.send({
    type: 'visit_updated',
    data: visitData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Уведомление о завершении осмотра
 */
export function broadcastExaminationCompleted(examinationData: any) {
  websocketService.send({
    type: 'examination_completed',
    data: examinationData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Уведомление об обновлении маршрутного листа
 */
export function broadcastRouteSheetUpdated(routeSheetData: any) {
  websocketService.send({
    type: 'route_sheet_updated',
    data: routeSheetData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Уведомление об обновлении амбулаторной карты
 */
export function broadcastCardUpdated(cardData: any) {
  websocketService.send({
    type: 'card_updated',
    data: cardData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * React Hook для использования WebSocket
 */
export function useWebSocket(
  userId: string,
  eventType: WebSocketEventType,
  handler: MessageHandler
) {
  React.useEffect(() => {
    // Подключаемся при монтировании
    websocketService.connect(userId);

    // Подписываемся на события
    const unsubscribe = websocketService.on(eventType, handler);

    // Отписываемся при размонтировании
    return () => {
      unsubscribe();
    };
  }, [userId, eventType, handler]);

  return {
    isConnected: websocketService.isConnected(),
    send: (message: WebSocketMessage) => websocketService.send(message),
  };
}

// Для использования в компонентах без React
import React from 'react';

