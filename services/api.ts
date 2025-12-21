import { Employee, ContractDocument } from '../types';

// Используем относительный путь для API - проксируется через Vite
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
  role: 'clinic' | 'organization' | 'doctor' | 'employee' | 'registration';
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




