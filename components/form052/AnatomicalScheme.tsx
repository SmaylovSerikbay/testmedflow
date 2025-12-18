import React, { useRef, useState } from 'react';

interface Marking {
  x: number;
  y: number;
  description: string;
  id: string;
}

interface AnatomicalSchemeProps {
  gender: 'male' | 'female';
  view: 'front' | 'back';
  markings?: Marking[];
  onMarkingAdd?: (marking: Marking) => void;
  onMarkingRemove?: (id: string) => void;
  onMarkingUpdate?: (id: string, marking: Partial<Marking>) => void;
  editMode: boolean;
  className?: string;
}

const AnatomicalScheme: React.FC<AnatomicalSchemeProps> = ({
  gender,
  view,
  markings = [],
  onMarkingAdd,
  onMarkingRemove,
  onMarkingUpdate,
  editMode,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inputDescription, setInputDescription] = useState('');
  const [pendingMarking, setPendingMarking] = useState<{ x: number; y: number } | null>(null);
  const [selectedMarking, setSelectedMarking] = useState<Marking | null>(null);
  const [draggedMarking, setDraggedMarking] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [wasDragging, setWasDragging] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onMarkingAdd) return;
    
    // Если только что было перетаскивание, не открываем модальное окно
    if (draggedMarking || wasDragging) {
      setWasDragging(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    // Координаты относительно видимой части изображения (0-100%)
    const localX = ((e.clientX - rect.left) / rect.width) * 100;
    const localY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Корректируем координаты для сохранения - нужно сохранять как координаты на полном изображении
    let adjustedX = localX;
    if (view === 'front') {
      // Для переднего вида: координаты 0-100% контейнера = 0-50% полного изображения
      adjustedX = localX / 2;
    } else {
      // Для заднего вида: координаты 0-100% контейнера = 50-100% полного изображения
      adjustedX = 50 + (localX / 2);
    }

    setPendingMarking({ x: adjustedX, y: localY });
    setInputDescription('');
    setShowInputModal(true);
  };

  const handleInputConfirm = () => {
    if (pendingMarking && inputDescription.trim() && onMarkingAdd) {
      const prefix = `${gender === 'male' ? 'мужчина' : 'женщина'} ${view === 'front' ? 'передний' : 'задний'}: `;
      onMarkingAdd({
        ...pendingMarking,
        description: prefix + inputDescription.trim(),
        id: Date.now().toString()
      });
    }
    setShowInputModal(false);
    setPendingMarking(null);
    setInputDescription('');
  };

  const handleInputCancel = () => {
    setShowInputModal(false);
    setPendingMarking(null);
    setInputDescription('');
  };

  const handleMarkingClick = (e: React.MouseEvent, marking: Marking) => {
    e.stopPropagation();
    // Показываем информацию о повреждении в модальном окне
    setSelectedMarking(marking);
    setShowInfoModal(true);
  };

  const handleMarkingRightClick = (e: React.MouseEvent, marking: Marking) => {
    e.preventDefault();
    e.stopPropagation();
    // Правый клик для удаления в режиме редактирования
    if (editMode && onMarkingRemove) {
      setSelectedMarking(marking);
      setShowDeleteConfirm(true);
    }
  };

  const handleMarkingMouseDown = (e: React.MouseEvent, marking: Marking) => {
    if (!editMode || !onMarkingUpdate) return;
    
    e.stopPropagation();
    
    // Сбрасываем флаги
    setHasMoved(false);
    setWasDragging(false);
    
    // Сохраняем начальную позицию мыши для определения, было ли движение
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    
    // Корректируем координаты для правильного расчета позиции
    let markingX = marking.x;
    if (view === 'back' && marking.x > 50) {
      markingX = ((marking.x - 50) / 50) * 100;
    } else if (view === 'front' && marking.x < 50) {
      markingX = (marking.x / 50) * 100;
    }
    
    const markingPixelX = (markingX / 100) * rect.width;
    const markingPixelY = (marking.y / 100) * rect.height;
    
    setDraggedMarking(marking.id);
    setDragOffset({
      x: e.clientX - rect.left - markingPixelX,
      y: e.clientY - rect.top - markingPixelY
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedMarking || !dragOffset || !onMarkingUpdate || !containerRef.current) return;

    // Отмечаем, что было движение мыши (это перетаскивание, а не клик)
    if (mouseDownPos && !hasMoved) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + 
        Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      if (distance >= 5) {
        // Если движение больше 5 пикселей, это перетаскивание
        setHasMoved(true);
        setWasDragging(true);
      }
    }

    // Перемещаем только если было движение
    if (hasMoved || (mouseDownPos && Math.sqrt(
      Math.pow(e.clientX - mouseDownPos.x, 2) + 
      Math.pow(e.clientY - mouseDownPos.y, 2)
    ) >= 5)) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      let x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      let y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      // Ограничиваем координаты пределами контейнера
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      // Корректируем координаты для сохранения - нужно сохранять как координаты на полном изображении
      let adjustedX = x;
      if (view === 'front') {
        // Для переднего вида: координаты 0-100% контейнера = 0-50% полного изображения
        adjustedX = x / 2;
      } else {
        // Для заднего вида: координаты 0-100% контейнера = 50-100% полного изображения
        adjustedX = 50 + (x / 2);
      }

      onMarkingUpdate(draggedMarking, { x: adjustedX, y });
    }
  };

  const handleMouseUp = () => {
    const markingId = draggedMarking;
    const hadMoved = hasMoved;
    
    // Небольшая задержка перед сбросом, чтобы предотвратить открытие модального окна при перетаскивании
    setTimeout(() => {
      setDraggedMarking(null);
      setDragOffset(null);
      setMouseDownPos(null);
      setHasMoved(false);
      
      // Сбрасываем флаг перетаскивания через небольшую задержку
      setTimeout(() => {
        setWasDragging(false);
      }, 200);
    }, 100);
  };

  React.useEffect(() => {
    if (draggedMarking) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedMarking, dragOffset, mouseDownPos, hasMoved]);

  const handleConfirmDelete = () => {
    if (selectedMarking && onMarkingRemove) {
      onMarkingRemove(selectedMarking.id);
    }
    setShowDeleteConfirm(false);
    setSelectedMarking(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedMarking(null);
  };

  // Используем локальные изображения
  const getImagePath = () => {
    const imageName = gender === 'male' ? 'man.png' : 'woman.png';
    return `/image/${imageName}`;
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef}
        className="w-full border-2 border-gray-600 rounded-lg relative overflow-hidden"
        style={{ 
          backgroundColor: '#fffef0',
          cursor: editMode ? 'crosshair' : 'default',
          minHeight: '500px',
          position: 'relative'
        }}
        onClick={handleClick}
      >
        {/* Фоновое изображение с обрезкой нужной части */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${getImagePath()})`,
            backgroundSize: '200% 100%', // Увеличиваем размер в 2 раза по ширине
            backgroundRepeat: 'no-repeat',
            backgroundPosition: view === 'front' ? 'left center' : 'right center',
            pointerEvents: 'none'
          }}
        />

        {/* Сетка поверх изображения */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(229, 231, 235, 0.3) 9px, rgba(229, 231, 235, 0.3) 10px),
                              repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(229, 231, 235, 0.3) 9px, rgba(229, 231, 235, 0.3) 10px)`,
            pointerEvents: 'none'
          }}
        />

        {/* Отметки поверх изображения */}
        {markings.map((marking, idx) => {
          // Фильтруем отметки по виду и полу
          const markingDesc = marking.description.toLowerCase();
          const isForThisView = 
            (view === 'front' && markingDesc.includes('передний')) ||
            (view === 'back' && markingDesc.includes('задний'));
          
          const isForThisGender = 
            (gender === 'male' && markingDesc.includes('мужчина')) ||
            (gender === 'female' && markingDesc.includes('женщина'));

          // Показываем только отметки, которые относятся к текущему виду и полу
          if (!isForThisView || !isForThisGender) {
            return null;
          }

          // Корректируем координаты для правильного отображения
          // Если отметка была сделана на полном изображении, нужно скорректировать координаты
          let displayX = marking.x;
          if (view === 'back') {
            // Для заднего вида: если координата была > 50%, значит это правая половина
            // Нужно преобразовать в координаты относительно правой половины (0-100%)
            if (marking.x > 50) {
              displayX = ((marking.x - 50) / 50) * 100;
            } else {
              // Если координата была < 50%, но отметка для заднего вида, возможно ошибка
              // Но все равно показываем
              displayX = (marking.x / 50) * 100;
            }
          } else {
            // Для переднего вида: если координата была < 50%, значит это левая половина
            // Нужно преобразовать в координаты относительно левой половины (0-100%)
            if (marking.x < 50) {
              displayX = (marking.x / 50) * 100;
            } else {
              // Если координата была > 50%, но отметка для переднего вида, возможно ошибка
              displayX = ((marking.x - 50) / 50) * 100;
            }
          }

          return (
            <div
              key={marking.id}
              style={{
                position: 'absolute',
                left: `${displayX}%`,
                top: `${marking.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: editMode ? (draggedMarking === marking.id ? 'grabbing' : 'grab') : 'pointer',
                zIndex: draggedMarking === marking.id ? 30 : 10,
                userSelect: 'none'
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Показываем информацию только если не было перетаскивания
                if (!wasDragging) {
                  handleMarkingClick(e, marking);
                }
              }}
              onContextMenu={(e) => handleMarkingRightClick(e, marking)}
              onMouseDown={(e) => {
                if (editMode && onMarkingUpdate) {
                  handleMarkingMouseDown(e, marking);
                }
              }}
            >
              {/* Внешний круг для лучшей видимости */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  border: '2px solid #ef4444',
                  opacity: 0.7
                }}
              />
              {/* Основной маркер */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '2px solid #dc2626',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                }}
              />
              {/* Номер */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '9px',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: '12px',
                  pointerEvents: 'none',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>
      
      {editMode && (
        <p className="text-xs text-slate-500 mt-2 text-center">
          Кликните на схеме, чтобы добавить отметку • Перетащите отметку для перемещения • Правый клик для удаления
        </p>
      )}

      {/* Модальное окно для показа информации о повреждении */}
      {showInfoModal && selectedMarking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => {
              setShowInfoModal(false);
              setSelectedMarking(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Информация о повреждении</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedMarking.description}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              {editMode && onMarkingRemove && (
                <button
                  type="button"
                  onClick={() => {
                    setShowInfoModal(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Удалить
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowInfoModal(false);
                  setSelectedMarking(null);
                }}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалог подтверждения удаления */}
      {showDeleteConfirm && selectedMarking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={handleCancelDelete}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full text-amber-600 bg-amber-50 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Удалить отметку?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Вы уверены, что хотите удалить эту отметку о повреждении?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all bg-amber-600 hover:bg-amber-700 text-white"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для ввода описания */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={handleInputCancel}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Добавить отметку о повреждении</h3>
            <textarea
              value={inputDescription}
              onChange={(e) => setInputDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Введите описание повреждения..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleInputConfirm();
                }
                if (e.key === 'Escape') {
                  handleInputCancel();
                }
              }}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleInputCancel}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInputConfirm}
                disabled={!inputDescription.trim()}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnatomicalScheme;
