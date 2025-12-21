import React, { useState, useEffect } from 'react';
import { Notification, notificationService } from '../services/notificationService';
import { 
  BellIcon, 
  XIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  FileTextIcon,
  UserMdIcon,
  CalendarIcon,
  ClockIcon
} from './Icons';

interface NotificationPanelProps {
  userId: string;
  userRole: 'registration' | 'doctor' | 'employee' | 'clinic' | 'organization';
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ userId, userRole }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  // Загрузка уведомлений
  useEffect(() => {
    loadNotifications();

    // Подписываемся на новые уведомления
    const unsubscribe = notificationService.subscribe(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Показываем браузерное уведомление (если разрешено)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          badge: '/logo.png',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications(userId, filter === 'unread');
    setNotifications(allNotifications);
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  // Запрос разрешения на браузерные уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(userId);
    loadNotifications();
  };

  const handleDelete = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
    loadNotifications();
  };

  const handleClearAll = () => {
    if (confirm('Удалить все уведомления?')) {
      notificationService.clearAllNotifications(userId);
      loadNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'visit_registered':
        return <CalendarIcon className="w-5 h-5 text-blue-600" />;
      case 'examination_completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'route_updated':
        return <UserMdIcon className="w-5 h-5 text-amber-600" />;
      case 'document_issued':
        return <FileTextIcon className="w-5 h-5 text-purple-600" />;
      case 'final_conclusion':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircleIcon className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'visit_registered':
        return 'from-blue-50 to-blue-100/50 border-blue-200/50';
      case 'examination_completed':
        return 'from-green-50 to-green-100/50 border-green-200/50';
      case 'route_updated':
        return 'from-amber-50 to-amber-100/50 border-amber-200/50';
      case 'document_issued':
        return 'from-purple-50 to-purple-100/50 border-purple-200/50';
      case 'final_conclusion':
        return 'from-green-50 to-green-100/50 border-green-200/50';
      default:
        return 'from-slate-50 to-slate-100/50 border-slate-200/50';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="relative">
      {/* Кнопка уведомлений */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-all"
      >
        <BellIcon className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Панель уведомлений */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Панель */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <BellIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Уведомления</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition-all"
                >
                  <XIcon className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Фильтры */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === 'unread'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Непрочитанные ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Все
                </button>
              </div>
            </div>

            {/* Действия */}
            {notifications.length > 0 && (
              <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  Прочитать все
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  Очистить все
                </button>
              </div>
            )}

            {/* Список уведомлений */}
            <div className="max-h-[450px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-4">
                    <BellIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Нет уведомлений</p>
                  <p className="text-xs text-slate-400 mt-1">Все уведомления будут отображаться здесь</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-all ${
                        !notification.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center border`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-900">{notification.title}</h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{notification.message}</p>
                          {notification.senderName && (
                            <p className="text-[10px] text-slate-500 mb-2">
                              От: {notification.senderName}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <ClockIcon className="w-3 h-3" />
                              {formatTime(notification.createdAt)}
                            </div>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded transition-all"
                                >
                                  Прочитано
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded transition-all"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;

