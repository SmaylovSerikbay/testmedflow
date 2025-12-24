# Новая структура компонентов формы 052/у

## Обзор

Эта структура реализует упрощенную форму осмотра врача (Checkup Visit Form), оптимизированную для скорости заполнения и совместимую с формой 052/у согласно Приказу № ҚР ДСМ-131/2020.

## Структура файлов

```
src/
  types/
    medical-forms.ts          # Все TypeScript интерфейсы
  components/
    doctor-workspace/
      VisitForm052.tsx        # Главный контейнер формы осмотра
      partials/
        ObjectiveStatus.tsx   # Динамические поля объективного статуса
        DiagnosisPanel.tsx    # Панель диагноза и заключения
    diagnostics/
      LabResultsTable.tsx     # Таблица лабораторных результатов
      InstrumentalCard.tsx    # Карточка инструментальных исследований
  utils/
    labTemplates.ts           # Шаблоны лабораторных анализов
    specialtyMapper.ts        # Маппинг специальностей
```

## Ключевые компоненты

### 1. VisitForm052.tsx

Главный компонент формы осмотра врача. Включает:
- **Секция A**: Субъективные данные (жалобы, анамнез)
- **Секция B**: Объективные данные (динамические поля по специальности)
- **Секция C**: Заключение (МКБ-10, профпригодность, рекомендации)
- **Кнопка "Заполнить нормой"**: Автоматически заполняет все поля нормативными значениями

### 2. ObjectiveStatus.tsx

Динамический компонент, который отображает разные поля в зависимости от специальности:
- **Терапевт**: общее состояние, сознание, кожные покровы, органы дыхания, ССС, живот, печень, селезенка
- **ЛОР**: уши, носовое дыхание, зев, миндалины, гортань
- **Хирург**: кожные покровы, вены, живот, грыжи, суставы
- **Остальные**: универсальное текстовое поле

### 3. DiagnosisPanel.tsx

Панель для ввода диагноза и заключения:
- Поле для МКБ-10 кода
- Кнопки выбора заключения (Годен/Не годен/Требует обследования)
- Поле для рекомендаций

### 4. LabResultsTable.tsx

Умная таблица для лабораторных анализов:
- Автоматическая валидация значений (красная рамка при отклонении от нормы)
- Кнопка "Заполнить все нормой" (заполняет средними значениями референсного диапазона)
- Отображение статуса (Норма/Отклонение)

### 5. InstrumentalCard.tsx

Карточка для инструментальных исследований (ЭКГ, Рентген, УЗИ):
- Загрузка файлов (drag & drop)
- Быстрые чипы для добавления стандартных формулировок
- Поля: дата, номер, результат

## Использование

### Пример использования VisitForm052:

```typescript
import VisitForm052 from './src/components/doctor-workspace/VisitForm052';
import { DoctorVisit } from './src/types/medical-forms';

const handleSave = async (visit: DoctorVisit) => {
  // Сохранение визита в амбулаторную карту
  await apiUpsertAmbulatoryCard({
    ...ambulatoryCard,
    specialistEntries: {
      ...ambulatoryCard.specialistEntries,
      [specialty]: {
        complaints: visit.complaints,
        anamnesis: visit.anamnesis,
        objective: JSON.stringify(visit.objectiveData),
        diagnosis: visit.icd10Code,
        recommendations: visit.recommendations,
        fitnessStatus: visit.conclusion === 'FIT' ? 'fit' : 'unfit'
      }
    }
  });
};

<VisitForm052
  patient={{ id: '123', name: 'Иванов И.И.', iin: '123456789012' }}
  specialty="THERAPIST"
  doctorId="doc-123"
  doctorName="Петров П.П."
  onSave={handleSave}
  onClose={() => setOpen(false)}
  showToast={showToast}
/>
```

### Пример использования LabResultsTable:

```typescript
import LabResultsTable from './src/components/diagnostics/LabResultsTable';
import { LAB_TEMPLATES } from './src/utils/labTemplates';

<LabResultsTable
  template={LAB_TEMPLATES['general-blood']}
  onSave={(parameters) => {
    // Сохранение результатов
    console.log('Saved:', parameters);
  }}
/>
```

## Интеграция с существующим кодом

Новая структура совместима с существующей системой:
- Использует те же API функции (`apiUpsertAmbulatoryCard`)
- Сохраняет данные в том же формате `AmbulatoryCard`
- Может использоваться параллельно со старой формой

## Миграция

Для перехода на новую форму:
1. Замените `AmbulatoryCard` на `VisitForm052` в `DoctorWorkspace`
2. Используйте `mapSpecialtyToEnum` для преобразования специальностей
3. Обновите обработчики сохранения для работы с новым форматом `DoctorVisit`

## Особенности

- **One-Click Norm**: Критически важная функция для скорости - заполняет все поля нормативными значениями одним кликом
- **Валидация в реальном времени**: Лабораторные результаты проверяются автоматически
- **Динамические поля**: Автоматически подстраиваются под специальность врача
- **Быстрые шаблоны**: Чипы для быстрого добавления стандартных формулировок

