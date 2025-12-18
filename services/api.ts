import { Employee, ContractDocument } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

  try {
    if (import.meta.env.DEV) {
      console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}${path}`);
    }
    const res = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (import.meta.env.DEV) {
        console.error(`API Error Response for ${path} (Status: ${res.status}):`, text);
      }
      throw new Error(text || `Request failed with status ${res.status}`);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await res.json();
      if (import.meta.env.DEV) {
        console.log(`API Response for ${path}:`, jsonData);
      }
      return jsonData as T;
    } else {
      const text = await res.text();
      if (import.meta.env.DEV) {
        console.log(`API Text Response for ${path}:`, text);
      }
      return text as T;
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      if (import.meta.env.DEV) {
        console.error(`API request timeout for ${path}`);
      }
      throw new Error('Request timeout');
    }
    if (import.meta.env.DEV) {
      console.error(`API request error for ${path}:`, error);
    }
    throw error;
  }
}

// --- USERS ---

export interface ApiUser {
  uid: string;
  role: 'clinic' | 'organization' | 'doctor' | 'employee';
  bin?: string;
  companyName?: string;
  leaderName?: string;
  phone: string;
  createdAt?: string;
  // Для врачей
  doctorId?: string;
  clinicId?: string;
  specialty?: string;
  clinicBin?: string;
  // Для сотрудников
  employeeId?: string;
  contractId?: string;
}

export async function apiGetUserByPhone(phone: string): Promise<ApiUser | null> {
  const cleanPhone = phone.replace(/\D/g, '');
  try {
    const data = await request<{ user: ApiUser | null }>(`/api/users/by-phone?phone=${cleanPhone}`);
    return data.user ?? null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('apiGetUserByPhone: error', error);
    }
    throw error;
  }
}

export async function apiGetUserByBin(bin: string): Promise<ApiUser | null> {
  const cleanBin = bin.replace(/\D/g, '');
  if (cleanBin.length !== 12) {
    return null;
  }
  try {
    const data = await request<{ user: ApiUser | null }>(`/api/users/by-bin?bin=${cleanBin}`);
    return data.user ?? null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('apiGetUserByBin: error', error);
    }
    throw error;
  }
}

export async function apiGetUserByUid(uid: string): Promise<ApiUser | null> {
  try {
    const data = await request<{ user: ApiUser | null }>(`/api/users/by-uid?uid=${encodeURIComponent(uid)}`);
    return data.user ?? null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('apiGetUserByUid: error', error);
    }
    throw error;
  }
}

export async function apiCreateUser(user: ApiUser): Promise<void> {
  await request('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

// --- CONTRACTS ---

export interface ApiCalendarPlan {
  startDate: string;
  endDate: string;
  status: 'draft' | 'approved' | 'rejected';
  rejectReason?: string;
}

export type ApiContractStatus = 'request' | 'negotiation' | 'planning' | 'execution' | 'completed';

export interface ApiContract {
  id: number;
  number: string;
  clientName: string;
  clientBin: string;
  clientSigned: boolean;
  clinicName: string;
  clinicBin: string;
  clinicSigned: boolean;
  date: string;
  status: ApiContractStatus;
  price: number;
  plannedHeadcount: number;
  employees?: Employee[];
  documents?: ContractDocument[];
  calendarPlan?: ApiCalendarPlan;
  clientSignOtp?: string | null;
  clinicSignOtp?: string | null;
}

export async function apiListContractsByBin(bin: string): Promise<ApiContract[]> {
  const cleanBin = bin.trim();
  return request<ApiContract[]>(`/api/contracts?bin=${cleanBin}`);
}

export interface ApiCreateContractPayload {
  number?: string;
  clientName: string;
  clientBin: string;
  clinicName: string;
  clinicBin: string;
  date?: string;
  status?: ApiContractStatus;
  price: number;
  plannedHeadcount: number;
}

export async function apiCreateContract(payload: ApiCreateContractPayload): Promise<ApiContract> {
  return request<ApiContract>('/api/contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetContract(id: number): Promise<ApiContract> {
  return request<ApiContract>(`/api/contracts/${id}`);
}

export async function apiUpdateContract(id: number, patch: Partial<ApiContract> & Record<string, any>): Promise<void> {
  await request(`/api/contracts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// --- DOCTORS ---

export interface ApiDoctor {
  id: number;
  clinicUid: string;
  name: string;
  specialty: string;
  phone?: string;
  isChairman: boolean;
}

export async function apiListDoctors(clinicUid: string): Promise<ApiDoctor[]> {
  // URL-encode clinicUid для безопасной передачи
  const encodedUid = encodeURIComponent(clinicUid);
  return request<ApiDoctor[]>(`/api/clinics/${encodedUid}/doctors`);
}

export async function apiCreateDoctor(clinicUid: string, doctor: Omit<ApiDoctor, 'id' | 'clinicUid'>): Promise<ApiDoctor> {
  // URL-encode clinicUid для безопасной передачи
  const encodedUid = encodeURIComponent(clinicUid);
  return request<ApiDoctor>(`/api/clinics/${encodedUid}/doctors`, {
    method: 'POST',
    body: JSON.stringify(doctor),
  });
}

export async function apiUpdateDoctor(clinicUid: string, id: number, doctor: Omit<ApiDoctor, 'id' | 'clinicUid'>): Promise<void> {
  // URL-encode clinicUid для безопасной передачи
  const encodedUid = encodeURIComponent(clinicUid);
  await request(`/api/clinics/${encodedUid}/doctors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(doctor),
  });
}

export async function apiDeleteDoctor(clinicUid: string, id: number): Promise<void> {
  // URL-encode clinicUid для безопасной передачи
  const encodedUid = encodeURIComponent(clinicUid);
  await request(`/api/clinics/${encodedUid}/doctors/${id}`, {
    method: 'DELETE',
  });
}

// --- ROUTE SHEETS ---

export interface ApiRouteSheetEmployee {
  employeeId: string;
  name: string;
  position: string;
  harmfulFactor: string;
  status: 'pending' | 'examined' | 'completed';
  examinationDate?: string;
}

export interface ApiRouteSheet {
  id: number;
  doctorId: string;
  contractId: number;
  specialty?: string;
  virtualDoctor: boolean;
  employees: ApiRouteSheetEmployee[];
  createdAt: string;
}

export async function apiListRouteSheets(params: { doctorId?: string; contractId?: number; specialty?: string }): Promise<ApiRouteSheet[]> {
  const queryParams = new URLSearchParams();
  if (params.doctorId) queryParams.append('doctorId', params.doctorId);
  if (params.contractId) queryParams.append('contractId', String(params.contractId));
  if (params.specialty) queryParams.append('specialty', params.specialty);
  return request<ApiRouteSheet[]>(`/api/route-sheets?${queryParams.toString()}`);
}

export async function apiCreateRouteSheet(routeSheet: Omit<ApiRouteSheet, 'id' | 'createdAt'>): Promise<ApiRouteSheet> {
  return request<ApiRouteSheet>('/api/route-sheets', {
    method: 'POST',
    body: JSON.stringify(routeSheet),
  });
}

export async function apiUpdateRouteSheet(id: number, patch: Partial<ApiRouteSheet> & Record<string, any>): Promise<void> {
  await request(`/api/route-sheets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// --- AMBULATORY CARDS ---

export interface ApiAmbulatoryCard {
  id: number;
  employeeId: string;
  contractId: number;
  cardNumber?: string;
  personalInfo?: Record<string, any>;
  anamnesis?: Record<string, any>;
  vitals?: Record<string, any>;
  labTests?: Record<string, any>;
  examinations: Record<string, any>;
  finalConclusion?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetAmbulatoryCard(employeeId: string, contractId: number): Promise<ApiAmbulatoryCard | null> {
  try {
    const data = await request<any>(`/api/ambulatory-cards?employeeId=${encodeURIComponent(employeeId)}&contractId=${contractId}`);
    
    console.log('📥 apiGetAmbulatoryCard - Raw API response:', {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      hasCard: data && 'card' in data,
      cardData: data?.card,
      anamnesis: data?.card?.anamnesis,
      vitals: data?.card?.vitals,
    });
    
    // Обрабатываем разные форматы ответа
    if (data && typeof data === 'object') {
      // Если ответ в формате {card: ...}
      if ('card' in data) {
        const card = data.card ?? null;
        if (card) {
          console.log('📥 apiGetAmbulatoryCard - Returning card:', {
            id: card.id,
            hasAnamnesis: !!card.anamnesis,
            hasVitals: !!card.vitals,
            anamnesis: card.anamnesis,
            vitals: card.vitals,
          });
        }
        return card;
      }
      // Если ответ - массив (неправильный формат, но обрабатываем)
      if (Array.isArray(data)) {
        console.warn('⚠️ apiGetAmbulatoryCard: received array instead of object, taking first item');
        return data.length > 0 ? data[0] : null;
      }
      // Если ответ - сам объект карты
      if ('id' in data && 'employeeId' in data) {
        return data as ApiAmbulatoryCard;
      }
    }
    
    console.warn('⚠️ apiGetAmbulatoryCard: unexpected response format', data);
    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('apiGetAmbulatoryCard: error', error);
    }
    throw error;
  }
}

export async function apiListAmbulatoryCardsByContract(contractId: number): Promise<ApiAmbulatoryCard[]> {
  return request<ApiAmbulatoryCard[]>(`/api/ambulatory-cards?contractId=${contractId}`);
}

export async function apiCreateAmbulatoryCard(card: Omit<ApiAmbulatoryCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiAmbulatoryCard> {
  return request<ApiAmbulatoryCard>('/api/ambulatory-cards', {
    method: 'POST',
    body: JSON.stringify(card),
  });
}

export async function apiUpdateAmbulatoryCard(id: number, patch: Partial<ApiAmbulatoryCard> & Record<string, any>): Promise<void> {
  await request(`/api/ambulatory-cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}



