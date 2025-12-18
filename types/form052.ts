// Расширенные типы для формы 052/у "Медицинская карта амбулаторного пациента"

// Общая часть - Паспортные данные
export interface PassportData {
  iin?: string; // ИИН
  fullName?: string; // ФИО (при его наличии)
  dateOfBirth?: string; // Дата рождения (дата месяц год)
  gender?: 'male' | 'female'; // Пол: мужской/женский
  age?: number; // Возраст
  nationality?: string; // Национальность
  resident?: 'city' | 'village'; // Житель: города/села
  citizenship?: string; // Гражданство
  address?: string; // Адрес проживания
  workplace?: string; // Место работы/учебы/детского учреждения
  position?: string; // Должность
  education?: string; // Образование
  insuranceCompany?: string; // Наименование страховой компании
  insurancePolicyNumber?: string; // № страхового полиса
  reimbursementType?: string; // Тип возмещения
  socialStatus?: string; // Социальный статус
  reasonForVisit?: string; // Повод обращения
}

// Минимальные медицинские данные
export interface MinimalMedicalData {
  bloodGroup?: string; // Группа крови
  rhFactor?: string; // Резус-фактор
  allergicReactions?: Array<{
    code?: string;
    name?: string;
  }>; // Аллергические реакции (код наименование)
  physiologicalState?: string; // Физиологическое состояние пациента (беременность)
  newbornScreening?: {
    date?: string;
    phenylketonuria?: string;
    congenitalHypothyroidism?: string;
    audiologicalScreening?: string;
  }; // Скрининг на наследственную патологию новорожденных
  harmfulHabits?: string; // Вредные привычки и риски для здоровья
  preventiveMeasures?: string; // Профилактические мероприятия, в том числе прививки
  diseaseHistory?: string; // История болезней и нарушений
  currentHealthProblems?: string; // Список текущих проблем со здоровьем
  dynamicObservation?: string; // Динамическое наблюдение
  disabilityGroup?: string; // Группа инвалидности
  currentMedications?: string; // Список принимаемых лекарственных средств
  anthropometricData?: {
    height?: number; // Рост (см)
    weight?: number; // Вес (кг)
    bmi?: number; // ИМТ
    headCircumference?: number; // Окружность головы (для детей)
  };
  fallRiskAssessment?: string; // Оценка риска падения
  painAssessment?: string; // Оценка боли
}

// Индивидуальный план работы с семьей
export interface FamilyWorkPlan {
  organization?: string; // Организация
  siteNumber?: string; // № Участка
  socialWorker?: {
    id?: string;
    fullName?: string;
  }; // Социальный работник
  midLevelWorker?: {
    id?: string;
    fullName?: string;
  }; // Средний медицинский работник
  planStartDate?: string; // Дата начала реализации Плана
  planEndDate?: string; // Дата завершения реализации Плана
  familyAddress?: string; // Адрес проживания семьи
  children?: Array<{
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female';
  }>; // Личные данные ребенка (детей)
  familyMembers?: Array<{
    fullName?: string;
    relationship?: string; // Кем приходится ребенку
    contactDetails?: string;
  }>; // Члены семьи, вовлеченные в планирование
  externalRepresentatives?: Array<{
    fullName?: string;
    organization?: string;
    contactDetails?: string;
  }>; // Представители внешних организаций
}

// Патронаж новорожденного (Вкладной лист 1)
export interface NewbornPatronage {
  examinationDate?: string; // Дата осмотра
  age?: string; // Возраст
  temperature?: number; // Температура
  birthWeight?: number; // Вес при рождении (кг)
  currentWeight?: number; // Текущий вес (кг)
  height?: number; // Рост (см)
  bmi?: number; // ИМТ
  headCircumference?: number; // Окружность головы (см)
  motherComplaints?: string; // Жалобы матери
  dangerousSigns?: string; // Признаки опасности
  complicatedAnamnesis?: boolean; // Отягощенный анамнез
  cranialNerves?: string; // Функция черепно-мозговых нервов
  reflexes?: {
    rooting?: string; // Поисковый
    sucking?: string; // Сосательный
    grasp?: string; // Хватательный
    moro?: string; // Моро
    automaticWalking?: string; // Автоматической походки
  };
  faceExamination?: string; // Осмотр лица
  skin?: string; // Кожа
  oralMucosa?: string; // Слизистые ротовой полости
  conjunctivae?: string; // Конъюнктивы
  muscleTone?: string; // Мышечный тонус
  visibleCongenitalMalformations?: string; // Видимые врожденные пороки
  skeletalSystem?: {
    headShape?: string; // Форма головы
    sutures?: string; // Швы
    largeFontanelle?: string; // Большой родничок
    smallFontanelle?: string; // Малый родничок
    joints?: string; // Суставы
  };
  respiratoryRate?: number; // Частота дыхания (ЧД)
  heartRate?: number; // Частота сердечных сокращений (ЧСС)
  heartRhythm?: string; // Сердечный ритм
  heartMurmurs?: string; // Сердечные шумы
  femoralPulse?: string; // Пальпация бедренного пульса
  abdomen?: string; // Живот
  liver?: string; // Печень
  spleen?: string; // Селезенка
  genitals?: string; // Половые органы
  umbilicalCord?: string; // Пуповина
  urination?: string; // Мочеиспускание
  stool?: string; // Стул
  feedingProblems?: {
    hasDifficulties?: boolean;
    isBreastfed?: boolean;
    feedingFrequency24h?: number;
    feedsAtNight?: boolean;
    receivesOtherFood?: boolean;
    otherFoodFrequency?: number;
    otherFoodDetails?: string;
  };
  breastfeedingAssessment?: {
    latchedWithinLastHour?: boolean;
    chinTouchesBreast?: boolean;
    mouthWideOpen?: boolean;
    lowerLipTurnedOut?: boolean;
    areolaVisibleAbove?: boolean;
    effectiveSucking?: boolean;
  };
  oralHealth?: {
    hasThrush?: boolean;
  };
  developmentalCare?: {
    howPlay?: string;
    howCommunicate?: string;
    developmentalProblems?: string;
  };
  vaccinationStatus?: {
    hepatitisB1?: boolean;
    bcg?: boolean;
    nextVisitDate?: string;
  };
  careAssessment?: {
    cribAndItems?: string;
    roomHygiene?: string;
    childHygiene?: string;
    careProblems?: string;
  };
  maternalHealth?: {
    breastExamination?: string;
    postpartumDepression?: {
      hasSymptoms?: boolean;
      symptoms?: string[];
    };
  };
  recommendations?: string; // Рекомендации
}

// Оценка развития ребенка (Вкладной лист 2)
export interface ChildDevelopmentAssessment {
  examinationDate?: string;
  age?: string;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  headCircumference?: number;
  physicalDevelopment?: string; // Оценка физического развития
  motherComplaints?: string;
  childExamination?: string;
  skin?: string;
  umbilicus?: string;
  oralMucosa?: string;
  pharynx?: string;
  conjunctivae?: string;
  largeFontanelle?: string;
  respiratoryOrgans?: string;
  respiratoryRate?: number;
  cardiovascularSystem?: {
    heartRate?: number;
    heartRhythm?: string;
    heartMurmurs?: string;
  };
  digestiveOrgans?: {
    abdomen?: string;
    liver?: string;
    spleen?: string;
  };
  urination?: string;
  stool?: string;
  diagnosis?: string;
  feedingAssessment?: {
    hasDifficulties?: boolean;
    isBreastfed?: boolean;
    feedingFrequency24h?: number;
    feedsAtNight?: boolean;
    receivesOtherFood?: boolean;
    otherFoodFrequency?: number;
    otherFoodDetails?: string;
  };
  complementaryFeeding?: {
    mainMealsPerDay?: number;
    snacksPerDay?: number;
    snackValue?: 'nutritious' | 'non-nutritious';
    amountPerMeal?: number; // мл
    consistency?: 'thick' | 'thin';
    lastWeekFoods?: {
      meatFish?: { yes: boolean; days?: number };
      legumes?: { yes: boolean; days?: number };
      vegetablesFruits?: { yes: boolean; days?: number };
    };
    teaGiven?: boolean;
    feedingMethod?: {
      bottle?: boolean;
      cup?: boolean;
      spoon?: boolean;
    };
  };
  vaccinations?: {
    hepatitisB1?: boolean;
    bcg?: boolean;
    dtpHib1?: boolean;
    hepatitisB2?: boolean;
    opv1?: boolean;
    dtpHib2?: boolean;
    hepatitisB3?: boolean;
    opv2?: boolean;
    dtpHib3?: boolean;
    opv3?: boolean;
    opv0?: boolean;
    measlesRubellaMumps?: boolean;
    dtpRevaccination?: boolean;
    hibRevaccination?: boolean;
    nextVisitDate?: string;
  };
  ricketsPrevention?: {
    nonSpecific?: string; // Неспецифическая профилактика
    specific?: {
      vitaminD?: boolean;
      dose?: number;
      duration?: string;
    };
  };
  psychomotorDevelopment?: {
    do?: string;
    dr?: string;
    pa?: string;
    rpi?: string;
    h?: string;
    e?: string;
  };
  developmentalCare?: {
    howPlay?: string;
    howCommunicate?: string;
    laggingBehind?: boolean;
    laggingDetails?: string;
  };
  careAssessment?: {
    knowsCareRules?: boolean;
    followsRecommendations?: boolean;
    knowsDangerSigns?: boolean;
  };
  careProblems?: string;
  abuseSigns?: {
    present?: boolean;
    details?: string;
  };
  warningSigns?: string; // Тревожные признаки, требующие специализированной помощи
}

// Динамическое наблюдение (Вкладной лист 4-5)
export interface DynamicObservation {
  treatedCase?: {
    anamnesis?: string; // Анамнез жизни
    diseaseAnamnesis?: string; // Анамнез заболевания
    objectiveData?: string; // Объективные данные
    labResultsInterpretation?: string; // Интерпретация результатов лабораторных анализов
    diagnosis?: {
      code?: string;
      name?: string;
    };
    prescribedServices?: string; // Назначение необходимых услуг и лекарственных средств
    doctorId?: string;
    doctorFullName?: string;
    consultations?: string; // Записи консилиумов
  };
  operationProtocol?: {
    date?: string;
    time?: string;
    indications?: string; // Показания к операции/процедуре/аферезу
    clinicalDiagnosis?: string;
    anestheticManagement?: string; // Анестезиологическое пособие
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    course?: string; // Течение операции
    consultants?: string; // Участие консультантов
    additionalResearch?: string; // Дополнительные методы исследования
    outcome?: string; // Исход операции
    complications?: string; // Осложнения
    bloodLoss?: number; // Количество кровопотери (мл)
    operationCode?: string;
    operationName?: string;
    postOpDiagnosis?: string; // Диагноз после операции
    recommendations?: string;
    operatingSurgeon?: {
      id?: string;
      fullName?: string;
    };
    assistants?: Array<{
      id?: string;
      fullName?: string;
    }>;
    anesthesiologist?: {
      id?: string;
      fullName?: string;
    };
    midLevelWorker?: {
      id?: string;
      fullName?: string;
    };
  };
  observationPlan?: {
    examinationDate?: string;
    diagnosis?: {
      code?: string;
      name?: string;
    };
    planStartDate?: string;
    planEndDate?: string;
    services?: Array<{
      service?: string; // Услуга из тарификатора
      plannedDate?: string;
      completionDate?: string;
    }>;
    recommendations?: string;
  };
}

// Профилактические мероприятия (Вкладной лист 6-7)
export interface PreventiveMeasures {
  examinationDate?: string;
  service?: string; // Услуга из тарификатора
  specialist?: {
    id?: string;
    fullName?: string;
  };
  diagnosticExaminations?: string; // Проведенные диагностические исследования
  instrumentalExaminations?: string; // Проведенные инструментальные исследования
  vaccinations?: Array<{
    diseaseName?: string; // Наименование заболевания (МКБ10)
    manufacturerCountry?: string; // Страна производитель
    batchNumber?: string; // Номер партии
    seriesNumber?: string; // Номер серии
    vaccineName?: string; // Название препарата вакцины
    method?: string; // Способ применения
    dosage?: number; // Дозировка
    unit?: string; // Единица измерения
    date?: string;
    time?: string;
    adverseReaction?: string; // Побочная реакция
    reactionClassifier?: string; // Классификатор побочной реакции
  }>;
  diagnosticProtocol?: {
    date?: string;
    time?: string;
    serviceName?: string; // Наименование услуги из тарификатора
    description?: string; // Данные описания проведенного исследования
    conclusion?: string; // Заключение
    medicalWorker?: {
      id?: string;
      fullName?: string;
    };
  };
}

// Карта осмотра при жестоком обращении (Вкладной лист 8-9)
export interface AbuseExaminationCard {
  referralDate?: string;
  referralTime?: string;
  reason?: 'bodily_injury' | 'psychological_impact' | 'both'; // Повод обращения
  complaints?: string; // Жалобы
  anamnesis?: {
    physicalViolence?: string; // Сведения о физическом насилии
    psychologicalViolence?: string; // Сведения о психологическом насилии
    timeDate?: string; // Время и дата
    weaponsUsed?: string; // Применение оружия
  };
  injuries?: {
    abrasions?: Array<{
      anatomicalLocation?: string; // Точная анатомическая локализация
      shape?: 'linear' | 'circular' | 'oval' | 'irregular_oval' | 'triangular';
      direction?: 'vertical' | 'horizontal' | 'oblique_vertical';
      dimensions?: {
        length?: number; // см
        width?: number; // см
      };
      baseCondition?: string; // Состояние дна
      surroundingTissues?: string; // Особенности окружающих мягких тканей
    }>;
    bruises?: Array<{
      anatomicalLocation?: string;
      shape?: 'linear' | 'circular' | 'oval';
      direction?: 'vertical' | 'horizontal' | 'oblique_vertical';
      dimensions?: {
        length?: number;
        width?: number;
      };
      color?: 'red_purple' | 'bluish_violet' | 'brownish' | 'greenish' | 'yellow';
      surroundingTissues?: string;
    }>;
    wounds?: Array<{
      anatomicalLocation?: string;
      shape?: 'linear' | 'spindle_shaped';
      dimensions?: {
        length?: number;
        width?: number;
      };
      tissueDefect?: boolean; // Наличие дефекта "минус-ткань"
      edges?: {
        abrasion?: boolean; // Осадненность
        bruising?: boolean; // Кровоподтечность
        detachment?: boolean; // Отслоенность
        contamination?: boolean; // Загрязненность
        foreignInclusions?: boolean; // Инородные включения
      };
      wallRelief?: string; // Рельеф скошенности стенок
      endsAbrasion?: string; // Осадненность концов
      bottomFeatures?: string; // Особенности дна
      hairDamage?: string; // Особенности повреждения волос
      microrelief?: string; // Особенности микрорельефа
    }>;
    fractures?: Array<{
      anatomicalLocation?: string;
      shape?: 'linear' | 'irregular' | 'comminuted';
      dimensions?: string;
      direction?: 'vertical' | 'horizontal' | 'oblique_vertical';
      fragments?: string; // Размеры, ориентировка свободных отломков
      spineInjury?: string; // Особенности повреждения позвоночника
    }>;
  };
  anatomicalScheme?: {
    front?: string; // Схема передней части (base64 или URL)
    back?: string; // Схема задней части (base64 или URL)
    markings?: Array<{
      x: number;
      y: number;
      description: string;
    }>;
  };
  psychologicalState?: {
    consciousness?: {
      clear?: boolean;
      impaired?: boolean;
      disoriented?: {
        time?: boolean;
        place?: boolean;
        personality?: boolean;
      };
      additionalInfo?: string;
    };
    behavior?: {
      adequate?: boolean;
      passive?: boolean;
      stupor?: boolean;
      agitated?: boolean;
      fearful?: boolean;
      tearful?: boolean;
      additionalInfo?: string;
    };
    mood?: {
      even?: boolean;
      lowered?: boolean;
      irritable?: boolean;
      elevated?: boolean;
      fearAnxiety?: boolean;
      additionalInfo?: string;
    };
    thinking?: {
      normal?: boolean;
      slowed?: boolean;
      accelerated?: boolean;
      circumstantial?: boolean;
      incoherent?: boolean;
      delusional?: boolean;
      suicidalThoughts?: boolean;
    };
    memory?: {
      impaired?: boolean;
    };
    attention?: {
      impaired?: boolean;
    };
    somatovegetative?: {
      rapidHeartbeat?: boolean;
      sweating?: boolean;
      tremor?: boolean;
      muscleTension?: boolean;
      suffocation?: boolean;
      chestDiscomfort?: boolean;
      dizziness?: boolean;
      weakness?: boolean;
      numbness?: boolean;
      additionalInfo?: string;
    };
    otherSymptoms?: {
      sleepDisorders?: boolean;
      appetiteDisorders?: boolean;
      psychologicalTrauma?: boolean;
      lossOfInterests?: boolean;
      secrecy?: boolean;
      alcoholUse?: boolean;
      despair?: boolean;
      hallucinations?: boolean;
      additionalInfo?: string;
    };
  };
}

// Карта осмотра сурдологического пациента (Вкладной лист 9)
export interface AudiologyExaminationCard {
  patientFullName?: string;
  age?: number;
  iin?: string;
  address?: string;
  referredForScreening?: boolean; // Направленные в рамках аудиологического скрининга
  referredForDisease?: boolean; // Направленные по заболеванию
  newlyDiagnosed?: boolean; // Впервые выявленное заболевание
  knownPriorDisease?: string; // Известное раннее заболевание
  complaints?: string; // Жалобы
  diseaseAnamnesis?: string; // Анамнез заболевания
  diagnosis?: {
    congenitalExternalEar?: {
      unilateral?: boolean;
      bilateral?: boolean;
      rightEar?: boolean; // АД
      leftEar?: boolean; // АС
    };
    congenitalInnerEar?: {
      unilateral?: boolean;
      bilateral?: boolean;
      rightEar?: boolean;
      leftEar?: boolean;
    };
    auditoryNeuropathy?: {
      unilateral?: boolean;
      bilateral?: boolean;
      rightEar?: boolean;
      leftEar?: boolean;
    };
    sensorineuralHearingLoss?: {
      degree1?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree2?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree3?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree4?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      deafness?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
    };
    conductiveHearingLoss?: {
      degree1?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree2?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree3?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree4?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      deafness?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
    };
    mixedHearingLoss?: {
      degree1?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree2?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree3?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      degree4?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
      deafness?: {
        unilateral?: boolean;
        bilateral?: boolean;
        rightEar?: boolean;
        leftEar?: boolean;
      };
    };
  };
  hearingAids?: {
    has?: boolean;
    airConduction?: {
      rightEar?: boolean;
      leftEar?: boolean;
    };
    boneConduction?: {
      rightEar?: boolean;
      leftEar?: boolean;
    };
  };
  implantableSystems?: {
    has?: boolean;
    middleEar?: {
      rightEar?: boolean;
      leftEar?: boolean;
    };
    boneConduction?: {
      rightEar?: boolean;
      leftEar?: boolean;
    };
    cochlearImplantation?: {
      rightEar?: boolean;
      leftEar?: boolean;
    };
  };
  educationalInstitution?: {
    preschool?: {
      general?: boolean;
      special?: boolean;
    };
    school?: {
      general?: boolean;
      special?: boolean;
    };
    higher?: boolean;
    secondary?: boolean;
  };
  workplace?: boolean;
  unorganized?: boolean;
}

// Полная форма 052/у
export interface Form052Data {
  // Общая часть
  passportData?: PassportData;
  minimalMedicalData?: MinimalMedicalData;
  
  // Индивидуальный план работы с семьей
  familyWorkPlan?: FamilyWorkPlan;
  
  // Патронаж новорожденного (Вкладной лист 1)
  newbornPatronage?: NewbornPatronage;
  
  // Оценка развития ребенка (Вкладной лист 2)
  childDevelopment?: ChildDevelopmentAssessment;
  
  // Рекомендации (Вкладной лист 3)
  recommendations?: {
    problems?: string[];
    familyPlanning?: string; // Консультирование по вопросам планирования семьи
    recommendations?: string[];
    specialistConsultation?: {
      date?: string;
      time?: string;
      type?: string;
      complaints?: string;
    };
  };
  
  // Динамическое наблюдение (Вкладной лист 4-5)
  dynamicObservation?: DynamicObservation;
  
  // Профилактические мероприятия (Вкладной лист 6-7)
  preventiveMeasures?: PreventiveMeasures;
  
  // Карта осмотра при жестоком обращении (Вкладной лист 8-9)
  abuseExamination?: AbuseExaminationCard;
  
  // Карта осмотра сурдологического пациента (Вкладной лист 9)
  audiologyExamination?: AudiologyExaminationCard;
  
  // Метаданные
  cardNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id?: string;
    fullName?: string;
  };
}

