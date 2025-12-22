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
  
  return request<AmbulatoryCard | null>(`/api/ambulatory-cards?${query.toString()}`);
}

export async function apiUpsertAmbulatoryCard(card: AmbulatoryCard): Promise<void> {
  await request('/api/ambulatory-cards', {
    method: 'POST',
    body: JSON.stringify(card),
  });
}

// --- РАСШИРЕННЫЙ ФУНКЦИОНАЛ (критические и важные доработки) ---

import { NamedLists, EmergencyNotice, SummaryReport } from '../types';

// Поименные списки (п.15 Приказа)
export async function apiGetNamedLists(contractId: number): Promise<NamedLists> {
  return request<NamedLists>(`/api/contracts/${contractId}/named-lists`);
}

export async function apiUpdateNamedLists(contractId: number, lists: NamedLists): Promise<void> {
  await request(`/api/contracts/${contractId}/named-lists`, {
    method: 'POST',
    body: JSON.stringify(lists),
  });
}

// Сводный отчет (п.17 Приказа)
export async function apiGetSummaryReport(contractId: number): Promise<SummaryReport | null> {
  return request<SummaryReport | null>(`/api/contracts/${contractId}/summary-report`);
}

export async function apiCreateSummaryReport(contractId: number, report: Omit<SummaryReport, 'contractId' | 'reportDate'>): Promise<SummaryReport> {
  return request<SummaryReport>(`/api/contracts/${contractId}/summary-report`, {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

// Экстренные извещения (п.19 Приказа)
export async function apiListEmergencyNotices(contractId: number): Promise<EmergencyNotice[]> {
  return request<EmergencyNotice[]>(`/api/contracts/${contractId}/emergency-notices`);
}

export async function apiCreateEmergencyNotice(contractId: number, notice: Omit<EmergencyNotice, 'id' | 'contractId' | 'sentDate' | 'status'>): Promise<EmergencyNotice> {
  return request<EmergencyNotice>(`/api/contracts/${contractId}/emergency-notices`, {
    method: 'POST',
    body: JSON.stringify(notice),
  });
}

// План оздоровления (п.20 Приказа)
export async function apiGetHealthPlan(contractId: number): Promise<{ content: string }> {
  return request<{ content: string }>(`/api/contracts/${contractId}/health-plan`);
}

export async function apiUpdateHealthPlan(contractId: number, content: string): Promise<void> {
  await request(`/api/contracts/${contractId}/health-plan`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// Передача медицинских карт (п.18, п.123 Приказа)
export async function apiTransferAmbulatoryCard(params: {
  patientUid: string;
  iin: string;
  targetClinic: string;
  reason: 'dismissal' | 'transfer';
  newWorkplace?: string;
}): Promise<{ status: string; transfer: any; card: AmbulatoryCard }> {
  return request('/api/ambulatory-cards/transfer', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

