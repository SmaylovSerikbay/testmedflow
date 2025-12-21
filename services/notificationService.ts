/**
 * Сервис электронных уведомлений между участниками системы
 * Обеспечивает связь между регистратурой, врачами и сотрудниками
 */

export interface Notification {
  id: string;
  type: 'visit_registered' | 'examination_completed' | 'route_updated' | 'document_issued' | 'final_conclusion';
  title: string;
  message: string;
  recipientId: string;
  recipientRole: 'registration' | 'doctor' | 'employee' | 'clinic' | 'organization';
  senderId?: string;
  senderName?: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Map<string, Set<(notification: Notification) => void>> = new Map();

  /**
   * Подписка на уведомления для конкретного пользователя
   */
  subscribe(userId: string, callback: (notification: Notification) => void) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(callback);

    // Возвращаем функцию отписки
    return () => {
      const callbacks = this.listeners.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(userId);
        }
      }
    };
  }

  /**
   * Отправка уведомления
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Сохраняем в локальное хранилище
    this.notifications.push(newNotification);
    this.saveToLocalStorage();

    // Уведомляем подписчиков
    const callbacks = this.listeners.get(notification.recipientId);
    if (callbacks) {
      callbacks.forEach(callback => callback(newNotification));
    }

    // Отправляем через API (если есть backend endpoint)
    try {
      // TODO: Реализовать отправку через API
      // await apiSendNotification(newNotification);
    } catch (error) {
      console.error('Error sending notification via API:', error);
    }

    return newNotification;
  }

  /**
   * Получение всех уведомлений для пользователя
   */
  getNotifications(userId: string, unreadOnly = false): Notification[] {
    this.loadFromLocalStorage();
    let userNotifications = this.notifications.filter(n => n.recipientId === userId);
    
    if (unreadOnly) {
      userNotifications = userNotifications.filter(n => !n.read);
    }

    return userNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Отметить уведомление как прочитанное
   */
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToLocalStorage();
    }
  }

  /**
   * Отметить все уведомления пользователя как прочитанные
   */
  markAllAsRead(userId: string) {
    this.notifications
      .filter(n => n.recipientId === userId)
      .forEach(n => n.read = true);
    this.saveToLocalStorage();
  }

  /**
   * Удалить уведомление
   */
  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveToLocalStorage();
  }

  /**
   * Очистить все уведомления пользователя
   */
  clearAllNotifications(userId: string) {
    this.notifications = this.notifications.filter(n => n.recipientId !== userId);
    this.saveToLocalStorage();
  }

  // Вспомогательные методы для работы с localStorage
  private saveToLocalStorage() {
    try {
      localStorage.setItem('medwork_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('medwork_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
  }

  // Предопределенные типы уведомлений

  /**
   * Уведомление о регистрации посещения (для врача и сотрудника)
   */
  async notifyVisitRegistered(
    employeeId: string,
    employeeName: string,
    doctorId: string,
    registrarName: string,
    visitData: any
  ) {
    // Уведомление для врача
    await this.sendNotification({
      type: 'visit_registered',
      title: 'Новый пациент',
      message: `${employeeName} зарегистрирован на осмотр`,
      recipientId: doctorId,
      recipientRole: 'doctor',
      senderName: registrarName,
      data: visitData,
    });

    // Уведомление для сотрудника
    await this.sendNotification({
      type: 'visit_registered',
      title: 'Регистрация завершена',
      message: `Вы зарегистрированы на медицинский осмотр. Пожалуйста, следуйте маршрутному листу.`,
      recipientId: employeeId,
      recipientRole: 'employee',
      senderName: registrarName,
      data: visitData,
    });
  }

  /**
   * Уведомление о завершении осмотра (для регистратуры и сотрудника)
   */
  async notifyExaminationCompleted(
    employeeId: string,
    employeeName: string,
    doctorName: string,
    specialty: string,
    registrationDeskId: string,
    examinationData: any
  ) {
    // Уведомление для регистратуры
    await this.sendNotification({
      type: 'examination_completed',
      title: 'Осмотр завершен',
      message: `${employeeName} прошел осмотр у ${specialty}`,
      recipientId: registrationDeskId,
      recipientRole: 'registration',
      senderName: doctorName,
      data: examinationData,
    });

    // Уведомление для сотрудника
    await this.sendNotification({
      type: 'examination_completed',
      title: 'Осмотр завершен',
      message: `Осмотр у ${specialty} завершен. Результаты внесены в вашу амбулаторную карту.`,
      recipientId: employeeId,
      recipientRole: 'employee',
      senderName: doctorName,
      data: examinationData,
    });
  }

  /**
   * Уведомление об обновлении маршрута (для сотрудника)
   */
  async notifyRouteUpdated(
    employeeId: string,
    employeeName: string,
    registrarName: string,
    routeData: any
  ) {
    await this.sendNotification({
      type: 'route_updated',
      title: 'Маршрут обновлен',
      message: `Ваш маршрутный лист был обновлен. Проверьте актуальную информацию.`,
      recipientId: employeeId,
      recipientRole: 'employee',
      senderName: registrarName,
      data: routeData,
    });
  }

  /**
   * Уведомление о выдаче документа (для сотрудника)
   */
  async notifyDocumentIssued(
    employeeId: string,
    documentType: string,
    registrarName: string,
    documentData: any
  ) {
    await this.sendNotification({
      type: 'document_issued',
      title: 'Документ выдан',
      message: `Вам выдан документ: ${documentType}`,
      recipientId: employeeId,
      recipientRole: 'employee',
      senderName: registrarName,
      data: documentData,
    });
  }

  /**
   * Уведомление о финальном заключении (для всех участников)
   */
  async notifyFinalConclusion(
    employeeId: string,
    employeeName: string,
    doctorName: string,
    conclusion: string,
    registrationDeskId: string,
    organizationId: string,
    conclusionData: any
  ) {
    // Уведомление для сотрудника
    await this.sendNotification({
      type: 'final_conclusion',
      title: 'Финальное заключение готово',
      message: `Медицинский осмотр завершен. Заключение: ${conclusion}`,
      recipientId: employeeId,
      recipientRole: 'employee',
      senderName: doctorName,
      data: conclusionData,
    });

    // Уведомление для регистратуры
    await this.sendNotification({
      type: 'final_conclusion',
      title: 'Финальное заключение',
      message: `Для ${employeeName} готово финальное заключение`,
      recipientId: registrationDeskId,
      recipientRole: 'registration',
      senderName: doctorName,
      data: conclusionData,
    });

    // Уведомление для организации
    await this.sendNotification({
      type: 'final_conclusion',
      title: 'Финальное заключение сотрудника',
      message: `${employeeName}: медицинский осмотр завершен`,
      recipientId: organizationId,
      recipientRole: 'organization',
      senderName: doctorName,
      data: conclusionData,
    });
  }
}

// Экспортируем singleton instance
export const notificationService = new NotificationService();

