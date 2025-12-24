import { Employee, ContractDocument, AmbulatoryCard } from '../types';

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
      const text = await res.text();
      if (!text || text.trim() === '') {
        return null as T;
      }
      try {
        const jsonData = JSON.parse(text);
        if (import.meta.env.DEV) {
          console.log(`API Response for ${path}:`, jsonData);
        }
        return jsonData as T;
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error(`API JSON Parse Error for ${path}:`, e, 'Text:', text);
        }
        return null as T;
      }
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

// --- VISITS & ROUTE SHEETS ---

export interface ApiVisit {
  id: number;
  employeeId: string;
  employeeName: string;
  clientName?: string;
  contractId: number;
  clinicId: string;
  visitDate: string;
  status: 'registered' | 'in_progress' | 'completed' | 'cancelled';
  routeSheet: any[];
  checkInTime?: string;
}

export async function apiCreateVisit(payload: {
  employeeId: string;
  employeeName: string;
  clientName: string;
  contractId: number;
  clinicId: string;
  phone: string;
  routeSheet: any[];
}): Promise<{ id: number }> {
  return request<{ id: number }>('/api/visits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiListVisits(params: {
  clinicId?: string;
  doctorId?: string;
  employeeId?: string;
}): Promise<ApiVisit[]> {
  const query = new URLSearchParams();
  if (params.clinicId) query.append('clinicId', params.clinicId);
  if (params.doctorId) query.append('doctorId', params.doctorId);
  if (params.employeeId) query.append('employeeId', params.employeeId);
  
  return request<ApiVisit[]>(`/api/visits?${query.toString()}`);
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
  roomNumber?: string;
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

// --- AMBULATORY CARDS ---

export async function apiGetAmbulatoryCard(params: { patientUid?: string; iin?: string }): Promise<AmbulatoryCard | null> {
  const query = new URLSearchParams();
  if (params.patientUid) query.append('patientUid', params.patientUid);
  if (params.iin) query.append('iin', params.iin);
  
  console.log('apiGetAmbulatoryCard: Requesting card', { patientUid: params.patientUid, iin: params.iin });
  
  const data = await request<any>(`/api/ambulatory-cards?${query.toString()}`);
  
  if (!data) {
    console.log('apiGetAmbulatoryCard: No card found');
    return null;
  }
  
  console.log('apiGetAmbulatoryCard: Received data', {
    patientUid: data.patientUid,
    iin: data.iin,
    hasSpecialistEntries: !!data.specialistEntries,
    specialistEntriesType: typeof data.specialistEntries
  });
  
  // Парсим JSON поля если они пришли как строки или json.RawMessage
  let specialistEntries = data.specialistEntries;
  if (typeof specialistEntries === 'string') {
    try {
      specialistEntries = JSON.parse(specialistEntries);
    } catch (e) {
      console.error('apiGetAmbulatoryCard: Error parsing specialistEntries string', e);
      specialistEntries = {};
    }
  }
  
  let labResults = data.labResults;
  if (typeof labResults === 'string') {
    try {
      labResults = JSON.parse(labResults);
    } catch (e) {
      console.error('apiGetAmbulatoryCard: Error parsing labResults string', e);
      labResults = {};
    }
  }
  
  // Парсим general и medical если они строки
  let general = data.general;
  if (typeof general === 'string') {
    try {
      general = JSON.parse(general);
    } catch (e) {
      console.error('apiGetAmbulatoryCard: Error parsing general string', e);
    }
  }
  
  let medical = data.medical;
  if (typeof medical === 'string') {
    try {
      medical = JSON.parse(medical);
    } catch (e) {
      console.error('apiGetAmbulatoryCard: Error parsing medical string', e);
    }
  }
  
  return {
    ...data,
    general: general || data.general,
    medical: medical || data.medical,
    specialistEntries: specialistEntries || {},
    labResults: labResults || {}
  } as AmbulatoryCard;
}

export async function apiUpsertAmbulatoryCard(card: AmbulatoryCard): Promise<void> {
  console.log('apiUpsertAmbulatoryCard: Sending card', {
    patientUid: card.patientUid,
    iin: card.iin,
    specialistEntries: card.specialistEntries,
    hasSpecialistEntries: !!card.specialistEntries,
    specialistEntriesKeys: card.specialistEntries ? Object.keys(card.specialistEntries) : []
  });
  
  try {
    await request('/api/ambulatory-cards', {
      method: 'POST',
      body: JSON.stringify(card),
    });
    console.log('apiUpsertAmbulatoryCard: Card saved successfully');
  } catch (error) {
    console.error('apiUpsertAmbulatoryCard: Error saving card', error);
    throw error;
  }
}




