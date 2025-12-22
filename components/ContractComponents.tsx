import React, { useState, useCallback } from 'react';
import { Contract, UserProfile, Employee, ContractDocument, NamedLists, SummaryReport, EmergencyNotice } from '../types';
import { LoaderIcon, PenIcon, CalendarIcon, CheckShieldIcon, FileTextIcon, FileSignatureIcon, UserMdIcon } from './Icons';
import { FactorRule } from '../factorRules';
import { resolveFactorRules, personalizeResearch } from '../utils/medicalRules';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  generateClinicRouteSheetPDF, 
  generateOrganizationRouteSheetPDF, 
  generateCommissionOrderPDF,
  generateFinalActPDF,
  generateHealthPlanPDF
} from '../utils/pdfGenerator';

// --- SIGNING CONTROLS ---
interface SigningControlsProps {
  currentUser: UserProfile | null;
  otpValue: string;
  setOtpValue: (value: string) => void;
  isRequestingOtp: boolean;
  isConfirmingOtp: boolean;
  otpSent: boolean;
  otpError: string;
  onRequestOtp: () => void;
  onConfirmOtp: () => void;
}

export const SigningControls: React.FC<SigningControlsProps> = ({
  currentUser,
  otpValue,
  setOtpValue,
  isRequestingOtp,
  isConfirmingOtp,
  otpSent,
  otpError,
  onRequestOtp,
  onConfirmOtp
}) => {
  const step = !otpSent ? 1 : otpValue.length === 4 ? 3 : 2;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <FileSignatureIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">Подписание договора</h3>
          <p className="text-xs text-slate-600">Подтвердите подписание через OTP код</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
        }`}>
          {step > 1 ? '✓' : '1'}
        </div>
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
        }`}>
          {step > 2 ? '✓' : '2'}
        </div>
        <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
        }`}>
          3
        </div>
      </div>

      {/* Step 1: Request OTP */}
      {!otpSent && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-slate-700 mb-2">
              Код подтверждения будет отправлен на ваш номер телефона:
            </p>
            <p className="font-mono font-semibold text-slate-900">{currentUser?.phone || 'Не указан'}</p>
          </div>
          <button
            onClick={onRequestOtp}
            disabled={isRequestingOtp || !currentUser?.phone}
            className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isRequestingOtp ? (
              <>
                <LoaderIcon className="w-5 h-5 animate-spin" />
                Отправка кода...
              </>
            ) : (
              <>
                <PenIcon className="w-5 h-5" />
                Получить код подтверждения
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Enter OTP */}
      {otpSent && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckShieldIcon className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Код отправлен!</p>
            </div>
            <p className="text-xs text-green-700">
              Проверьте WhatsApp на номер {currentUser?.phone}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Введите 4-значный код:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="flex-1 px-4 py-3.5 border-2 border-slate-300 rounded-xl text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                maxLength={4}
                autoFocus
              />
              <button
                onClick={onConfirmOtp}
                disabled={isConfirmingOtp || otpValue.length !== 4}
                className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isConfirmingOtp ? (
                  <>
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <CheckShieldIcon className="w-4 h-4" />
                    Подписать
                  </>
                )}
              </button>
            </div>
          </div>

          {otpError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700 font-medium">{otpError}</p>
            </div>
          )}

          <button
            onClick={onRequestOtp}
            disabled={isRequestingOtp}
            className="w-full text-sm text-slate-600 hover:text-slate-900 underline disabled:opacity-50"
          >
            Отправить код повторно
          </button>
        </div>
      )}
    </div>
  );
};

// --- COMMERCIAL TERMS CARD ---
interface CommercialTermsCardProps {
  contract: Contract;
}

export const CommercialTermsCard: React.FC<CommercialTermsCardProps> = ({ contract }) => (
  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 grid grid-cols-3 gap-4">
    <div>
      <p className="text-xs text-slate-400 uppercase font-bold">Сумма договора</p>
      <p className="text-lg font-bold">{contract.price?.toLocaleString()} ₸</p>
    </div>
    <div>
      <p className="text-xs text-slate-400 uppercase font-bold">Планируемый штат</p>
      <p className="text-lg font-bold">{contract.plannedHeadcount} чел.</p>
    </div>
    <div>
      <p className="text-xs text-slate-400 uppercase font-bold">Срок до</p>
      <p className="text-lg font-bold">{contract.calendarPlan?.endDate || '-'}</p>
    </div>
  </div>
);

// --- CALENDAR PLAN SECTION ---
interface CalendarPlanSectionProps {
  currentUser: UserProfile | null;
  contract: Contract;
  employees: any[];
  doctors?: any[]; // Врачи клиники
  planStart: string;
  planEnd: string;
  setPlanStart: (date: string) => void;
  setPlanEnd: (date: string) => void;
  isSavingPlan: boolean;
  onSavePlan: () => void;
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

export const CalendarPlanSection: React.FC<CalendarPlanSectionProps> = ({
  currentUser,
  contract,
  employees,
  doctors = [],
  planStart,
  planEnd,
  setPlanStart,
  setPlanEnd,
  isSavingPlan,
  onSavePlan,
  updateContract,
  showToast
}) => {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isPlanDecisionLoading, setIsPlanDecisionLoading] = useState(false);

  const handleApprovePlan = useCallback(async () => {
    if (!contract.calendarPlan?.startDate || !contract.calendarPlan?.endDate) {
      showToast('error', 'Календарный план ещё не заполнен клиникой.');
      return;
    }

    setIsPlanDecisionLoading(true);
    try {
      const existingDocs = contract.documents || [];
      const today = new Date().toISOString().split('T')[0];
      const baseId = Date.now();
      
      // Используем врачей из пропсов или из договора
      const contractDoctors = doctors.length > 0 ? doctors : (contract.doctors || []);
      console.log('Available doctors for route sheet creation:', contractDoctors.length, contractDoctors.map(d => `${d.name} (${d.specialty})`));
      
      const newDocs: ContractDocument[] = [
        {
          id: `${baseId}-route-sheet`,
          type: 'route_sheet' as const,
          title: 'Маршрутный лист',
          date: today,
        },
        {
          id: `${baseId}-order-commission`,
          type: 'order' as const,
          title: 'Приказ о составе врачебной комиссии',
          date: today,
        }
      ];

      // Проверяем, есть ли уже эти документы, чтобы не дублировать
      const hasRouteSheet = existingDocs.some(d => d.type === 'route_sheet');
      const hasOrder = existingDocs.some(d => d.type === 'order');
      
      const docsToAdd: ContractDocument[] = [];
      if (!hasRouteSheet) {
        docsToAdd.push(newDocs[0]);
      }
      if (!hasOrder) {
        docsToAdd.push(newDocs[1]);
      }

      await updateContract(contract.id, {
        calendarPlan: {
          ...contract.calendarPlan,
          status: 'approved',
          rejectReason: null,
        },
        documents: docsToAdd.length > 0 ? [...existingDocs, ...docsToAdd] : existingDocs,
        doctors: contractDoctors, // Сохраняем врачей в договоре
      });

      // Маршрутные листы удалены из системы

      setIsApproveModalOpen(false);
      showToast('success', 'План утверждён. Маршрутные листы и приказ сформированы.');
    } catch (e) {
      console.error('Plan approve error', e);
      showToast('error', 'Не удалось утвердить план. Попробуйте ещё раз.');
    } finally {
      setIsPlanDecisionLoading(false);
    }
  }, [contract, employees, doctors, updateContract, showToast]);

  const handleRejectPlan = useCallback(async () => {
    if (!contract.calendarPlan?.startDate || !contract.calendarPlan?.endDate) {
      showToast('error', 'Календарный план ещё не заполнен клиникой.');
      return;
    }

    setIsPlanDecisionLoading(true);
    try {
      const reason = rejectReasonInput.trim();

      await updateContract(contract.id, {
        calendarPlan: {
          ...contract.calendarPlan,
          status: 'rejected',
          rejectReason: reason || null,
        },
      });

      setIsRejectModalOpen(false);
      setRejectReasonInput('');
      showToast('info', 'План отклонён. Клиника получит уведомление и сможет отправить новый вариант.');
    } catch (e) {
      console.error('Plan reject error', e);
      showToast('error', 'Не удалось отклонить план. Попробуйте ещё раз.');
    } finally {
      setIsPlanDecisionLoading(false);
    }
  }, [contract, rejectReasonInput, updateContract, showToast]);

  return (
    <>
      <section className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Календарный план
          </h3>
          {contract.calendarPlan?.status === 'approved' && (
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase">
              Утвержден
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Начало</label>
              <input
                type="date"
                disabled={currentUser?.role !== 'clinic'}
                value={planStart}
                onChange={(e) => setPlanStart(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Конец</label>
              <input
                type="date"
                disabled={currentUser?.role !== 'clinic'}
                value={planEnd}
                onChange={(e) => setPlanEnd(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Краткий расчёт нагрузки */}
          <div className="text-[11px] text-slate-500 space-y-1">
            <p>Всего работников в контингенте: <span className="font-semibold">{employees.length}</span></p>
            {planStart && planEnd && (
              (() => {
                const start = new Date(planStart);
                const end = new Date(planEnd);
                const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                const perDay = Math.ceil((employees.length || 0) / days);
                return (
                  <p>
                    Период: {planStart} — {planEnd} ({days} дн.), ориентировочно{' '}
                    <span className="font-semibold">{perDay}</span> чел./день
                  </p>
                );
              })()
            )}
          </div>

          {/* Clinic Controls */}
          {currentUser?.role === 'clinic' && (
            <div className="space-y-1">
              {employees.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] text-amber-800 font-medium text-center">
                    Для отправки календарного плана сначала загрузите контингент работников (Приложение 3).
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={onSavePlan}
                    disabled={isSavingPlan || contract.calendarPlan?.status === 'approved'}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black disabled:opacity-60 transition-all shadow-md flex justify-center items-center gap-2"
                  >
                    {isSavingPlan ? (
                      <LoaderIcon className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        {contract.calendarPlan?.status === 'draft' && (
                          <CheckShieldIcon className="w-3 h-3 text-emerald-400" />
                        )}
                        {contract.calendarPlan?.status === 'draft'
                          ? 'План отправлен на согласование'
                          : contract.calendarPlan?.status === 'approved'
                          ? 'План утверждён работодателем'
                          : contract.calendarPlan?.status === 'rejected'
                          ? 'Отправить исправленный план'
                          : 'Отправить план на согласование'}
                      </>
                    )}
                  </button>
                  {contract.calendarPlan?.status === 'draft' && (
                    <p className="text-[10px] text-slate-400 text-center">
                      Ожидается утверждение плана работодателем.
                    </p>
                  )}
                  {contract.calendarPlan?.status === 'rejected' && (
                    <p className="text-[10px] text-red-500 text-center">
                      План отклонён работодателем{contract.calendarPlan?.rejectReason ? `: ${contract.calendarPlan.rejectReason}` : ''}.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Organization Controls */}
          {currentUser?.role === 'organization' && (
            <div className="space-y-2">
              {!contract.calendarPlan?.startDate && (
                <p className="text-xs text-slate-400 italic text-center">
                  Ожидание заполнения плана Клиникой...
                </p>
              )}
              {contract.calendarPlan?.startDate && contract.calendarPlan?.status === 'draft' && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setIsApproveModalOpen(true)}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md flex justify-center items-center gap-2"
                  >
                    Утвердить план
                  </button>
                  <button
                    onClick={() => {
                      setRejectReasonInput(contract.calendarPlan?.rejectReason || '');
                      setIsRejectModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-200 flex justify-center items-center gap-2"
                  >
                    Отклонить план
                  </button>
                </div>
              )}
              {contract.calendarPlan?.status === 'approved' && (
                <p className="text-[10px] text-emerald-600 text-center font-semibold">
                  План утверждён. Маршрутный лист и приказ сформированы.
                </p>
              )}
              {contract.calendarPlan?.status === 'rejected' && (
                <p className="text-[10px] text-red-500 text-center">
                  План отклонён{contract.calendarPlan?.rejectReason ? `: ${contract.calendarPlan.rejectReason}` : ''}. Ожидается новая версия от клиники.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Approve Modal */}
      {isApproveModalOpen && (
        <ApproveModal
          contract={contract}
          employees={employees}
          isPlanDecisionLoading={isPlanDecisionLoading}
          onClose={() => setIsApproveModalOpen(false)}
          onApprove={handleApprovePlan}
        />
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <RejectModal
          rejectReasonInput={rejectReasonInput}
          setRejectReasonInput={setRejectReasonInput}
          isPlanDecisionLoading={isPlanDecisionLoading}
          onClose={() => setIsRejectModalOpen(false)}
          onReject={handleRejectPlan}
        />
      )}
    </>
  );
};

// --- APPROVE MODAL ---
interface ApproveModalProps {
  contract: Contract;
  employees: any[];
  isPlanDecisionLoading: boolean;
  onClose: () => void;
  onApprove: () => void;
}

const ApproveModal: React.FC<ApproveModalProps> = ({
  contract,
  employees,
  isPlanDecisionLoading,
  onClose,
  onApprove
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      onClick={() => !isPlanDecisionLoading && onClose()}
    />
    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in-up">
      <h3 className="text-lg font-bold">Утвердить календарный план?</h3>
      <p className="text-sm text-slate-600">
        После утверждения будут автоматически сформированы маршрутные листы и приказ о составе врачебной комиссии.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
        <p>
          Период: <span className="font-semibold">{contract.calendarPlan?.startDate}</span> —{' '}
          <span className="font-semibold">{contract.calendarPlan?.endDate}</span>
        </p>
        <p>
          Контингент: <span className="font-semibold">{employees.length}</span> чел.
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={isPlanDecisionLoading}
          onClick={onClose}
          className="px-4 py-2 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={isPlanDecisionLoading}
          className="px-5 py-2 text-xs rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-60"
        >
          {isPlanDecisionLoading ? (
            <LoaderIcon className="w-3 h-3 animate-spin" />
          ) : (
            <CheckShieldIcon className="w-3 h-3" />
          )}
          Утвердить
        </button>
      </div>
    </div>
  </div>
);

// --- REJECT MODAL ---
interface RejectModalProps {
  rejectReasonInput: string;
  setRejectReasonInput: (reason: string) => void;
  isPlanDecisionLoading: boolean;
  onClose: () => void;
  onReject: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({
  rejectReasonInput,
  setRejectReasonInput,
  isPlanDecisionLoading,
  onClose,
  onReject
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      onClick={() => !isPlanDecisionLoading && onClose()}
    />
    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in-up">
      <h3 className="text-lg font-bold">Отклонить календарный план</h3>
      <p className="text-sm text-slate-600">
        Укажите причину отклонения плана. Клиника получит уведомление и сможет отправить исправленный вариант.
      </p>
      <textarea
        value={rejectReasonInput}
        onChange={(e) => setRejectReasonInput(e.target.value)}
        placeholder="Причина отклонения (необязательно)"
        className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:border-blue-500"
      />
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={isPlanDecisionLoading}
          onClick={onClose}
          className="px-4 py-2 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={isPlanDecisionLoading}
          className="px-5 py-2 text-xs rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 flex items-center gap-2 disabled:opacity-60"
        >
          {isPlanDecisionLoading ? (
            <LoaderIcon className="w-3 h-3 animate-spin" />
          ) : null}
          Отклонить
        </button>
      </div>
    </div>
  </div>
);

// --- DOCUMENTS SECTION ---
interface DocumentsSectionProps {
  contract: Contract;
  currentUser: UserProfile | null;
  employees: Employee[];
  doctors?: any[];
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  contract,
  currentUser,
  employees,
  doctors = [],
  updateContract,
  showToast
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ 
    finalAct: '', 
    healthPlan: '' 
  });
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ContractDocument | null>(null);
  
  // Новые модальные окна для расширенного функционала
  const [isNamedListsModalOpen, setIsNamedListsModalOpen] = useState(false);
  const [isSummaryReportModalOpen, setIsSummaryReportModalOpen] = useState(false);
  const [isEmergencyNoticesModalOpen, setIsEmergencyNoticesModalOpen] = useState(false);

  const documents = contract.documents || [];
  
  // Check if exam is finished (all employees have status other than pending)
  const isExamFinished = employees.length > 0 && employees.every(e => e.status !== 'pending');

  const handleGenerateRouteSheetsAndOrder = useCallback(async () => {
    if (!contract || employees.length === 0) {
      showToast('error', 'Сначала загрузите контингент работников');
      return;
    }

    if (doctors.length === 0 && currentUser?.role === 'clinic') {
      showToast('error', 'Сначала добавьте врачей во вкладке "Врачи"');
      return;
    }

    try {
      const existingDocs = contract.documents || [];
      const today = new Date().toISOString().split('T')[0];
      const baseId = Date.now();
      
      const newDocs: ContractDocument[] = [];
      
      // Проверяем, есть ли уже эти документы
      const hasRouteSheet = existingDocs.some(d => d.type === 'route_sheet');
      const hasOrder = existingDocs.some(d => d.type === 'order');
      
      if (!hasRouteSheet) {
        newDocs.push({
          id: `${baseId}-route-sheet`,
          type: 'route_sheet' as const,
          title: 'Маршрутный лист',
          date: today,
        });
      }
      
      if (!hasOrder) {
        newDocs.push({
          id: `${baseId}-order-commission`,
          type: 'order' as const,
          title: 'Приказ о составе врачебной комиссии',
          date: today,
        });
      }

      if (newDocs.length > 0) {
        await updateContract(contract.id, {
          documents: [...existingDocs, ...newDocs],
        });
        showToast('success', 'Маршрутный лист и приказ сформированы');
      } else {
        showToast('info', 'Документы уже существуют');
      }
    } catch (e) {
      console.error('Generate route sheets error', e);
      showToast('error', 'Не удалось сформировать документы');
    }
  }, [contract, employees, doctors, currentUser, updateContract, showToast]);

  const handleGenerateReports = useCallback(async () => {
    if (!contract) return;

    const total = employees.length;
    const fit = employees.filter(e => e.status === 'fit').length;
    const unfit = employees.filter(e => e.status === 'unfit').length;
    const observation = employees.filter(e => e.status === 'needs_observation').length;
    
    // Загружаем поименные списки, если они есть
    let namedLists: NamedLists | null = null;
    try {
      const { apiGetNamedLists } = await import('../services/api');
      namedLists = await apiGetNamedLists(Number(contract.id));
    } catch (e) {
      // Игнорируем ошибку, если списков еще нет
    }
    
    // Формируем поименные списки из данных сотрудников
    const transferList = namedLists?.transferToOtherWork || [];
    const hospitalList = namedLists?.hospitalTreatment || [];
    const sanatoriumList = namedLists?.sanatoriumTreatment || [];
    const nutritionList = namedLists?.therapeuticNutrition || [];
    const observationList = namedLists?.dynamicObservation || [];
    
    // Если списки пустые, заполняем на основе статусов сотрудников
    if (transferList.length === 0 && hospitalList.length === 0 && sanatoriumList.length === 0) {
      const unfitEmployees = employees.filter(e => e.status === 'unfit').map(e => `${e.name} (${e.position})`);
      const observationEmployees = employees.filter(e => e.status === 'needs_observation').map(e => `${e.name} (${e.position})`);
      
      // Автоматическое распределение по категориям
      if (unfitEmployees.length > 0) {
        transferList.push(...unfitEmployees.slice(0, Math.ceil(unfitEmployees.length / 2)));
        hospitalList.push(...unfitEmployees.slice(Math.ceil(unfitEmployees.length / 2)));
      }
      if (observationEmployees.length > 0) {
        observationList.push(...observationEmployees);
      }
    }
    
    const namedListsSection = `
ПОИМЕННЫЕ СПИСКИ (п.15 Приказа):

1. Лица, которым рекомендован перевод на другую работу:
${transferList.length > 0 ? transferList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (нет)'}

2. Лица, которым показано стационарное лечение:
${hospitalList.length > 0 ? hospitalList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (нет)'}

3. Лица, которым показано санаторно-курортное лечение:
${sanatoriumList.length > 0 ? sanatoriumList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (нет)'}

4. Лица, которым показано лечебно-профилактическое питание:
${nutritionList.length > 0 ? nutritionList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (нет)'}

5. Лица, которым показано динамическое наблюдение:
${observationList.length > 0 ? observationList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (нет)'}
`;
    
    const actTemplate = `ЗАКЛЮЧИТЕЛЬНЫЙ АКТ
по результатам проведенного периодического медицинского осмотра работников ${contract.clientName}

1. Медицинская организация: ${contract.clinicName}
2. Организация (Заказчик): ${contract.clientName}
3. Всего работников, подлежащих осмотру: ${total}
4. Всего осмотрено: ${total} (% охвата: 100%)
   - Признаны годными к работе: ${fit}
   - Выявлено лиц с подозрением на профзаболевание: 0
   - Нуждаются в дообследовании (в т.ч. в условиях стационара): ${observation}
   - Выявлено лиц с общими заболеваниями, являющимися противопоказаниями к работе: ${unfit}

${namedListsSection}

6. Результаты выполнения плана оздоровления за предыдущий год: 
   - Выполнено: 100%

Председатель врачебной комиссии: ____________________
Руководитель медицинской организации: ____________________
М.П.                                  (Дата)

Экземпляры направлены:
- Администрации организации (предприятия)
- Территориальным подразделениям ведомства государственного органа в сфере санитарно-эпидемиологического благополучия населения
- Один экземпляр остается в медицинской организации`;

    const obsEmployees = employees.filter(e => e.status === 'needs_observation' || e.status === 'unfit');
    const obsList = obsEmployees.length > 0 
        ? obsEmployees.map((e, i) => `${i+1}. ${e.name} (${e.position}) - ${e.status === 'unfit' ? 'Противопоказан' : 'Наблюдение'}`).join('\n')
        : 'Нет сотрудников, требующих оздоровительных мероприятий.';

    const planTemplate = `ПЛАН ОЗДОРОВЛЕНИЯ
работников ${contract.clientName} по результатам периодического медицинского осмотра

Список сотрудников, подлежащих оздоровлению (из группы 'Д' и группы риска):
${obsList}

РАСПРЕДЕЛЕНИЕ ПО ВИДАМ ОЗДОРОВЛЕНИЯ (Пункт 21):

1. Стационарное обследование и лечение:
${hospitalList.length > 0 ? hospitalList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (Заполните ФИО)'}

2. Амбулаторное обследование и лечение:
   (Заполните ФИО)

3. Санаторно-курортное лечение:
${sanatoriumList.length > 0 ? sanatoriumList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (Заполните ФИО)'}

4. Лечебно-профилактическое питание:
${nutritionList.length > 0 ? nutritionList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (Заполните ФИО)'}

5. Временный перевод на другую работу по состоянию здоровья:
${transferList.length > 0 ? transferList.map((name, i) => `   ${i+1}. ${name}`).join('\n') : '   (Заполните ФИО)'}

Врач-профпатолог: ____________________
Представитель работодателя: ____________________
Согласовано с территориальным подразделением: ____________________`;

    setReportForm({ 
      finalAct: contract.finalActContent || actTemplate, 
      healthPlan: contract.healthPlanContent || planTemplate 
    });
    setIsReportModalOpen(true);
  }, [contract, employees]);

  const handleSaveReports = useCallback(async () => {
    if (!contract.id) return;
    setIsSavingReport(true);
    try {
      const date = new Date().toLocaleDateString();
      const newDocs: ContractDocument[] = [];
      
      const existingDocs = documents;
      
      if (!existingDocs.find(d => d.type === 'final_act')) {
        newDocs.push({ 
          id: 'act_' + Date.now(), 
          type: 'final_act', 
          title: 'Заключительный акт', 
          date 
        });
      }
      if (!existingDocs.find(d => d.type === 'health_plan')) {
        newDocs.push({ 
          id: 'plan_' + Date.now(), 
          type: 'health_plan', 
          title: 'План оздоровления', 
          date 
        });
      }

      // Сохраняем поименные списки
      const { apiUpdateNamedLists } = await import('../services/api');
      const unfitEmployees = employees.filter(e => e.status === 'unfit').map(e => `${e.name} (${e.position})`);
      const observationEmployees = employees.filter(e => e.status === 'needs_observation').map(e => `${e.name} (${e.position})`);
      
      const namedLists: NamedLists = {
        transferToOtherWork: unfitEmployees.slice(0, Math.ceil(unfitEmployees.length / 2)),
        hospitalTreatment: unfitEmployees.slice(Math.ceil(unfitEmployees.length / 2)),
        sanatoriumTreatment: [],
        therapeuticNutrition: [],
        dynamicObservation: observationEmployees
      };
      
      try {
        await apiUpdateNamedLists(Number(contract.id), namedLists);
      } catch (e) {
        console.warn('Failed to save named lists:', e);
      }

      await updateContract(contract.id, {
        finalActContent: reportForm.finalAct,
        healthPlanContent: reportForm.healthPlan,
        documents: [...existingDocs, ...newDocs],
        status: 'completed'
      });
      setIsReportModalOpen(false);
      showToast('success', 'Заключительные документы сохранены');
    } catch(e) {
      showToast('error', 'Ошибка сохранения заключительных документов.');
    } finally {
      setIsSavingReport(false);
    }
  }, [contract.id, documents, reportForm, employees, updateContract, showToast]);

  const handlePreviewDocument = useCallback((doc: ContractDocument) => {
    // Показываем модальное окно для просмотра на сайте
    setPreviewDoc(doc);
  }, []);

  const handleDownloadDocument = useCallback(async (doc: ContractDocument) => {
    try {
      // Используем html2canvas для генерации PDF с правильной поддержкой кириллицы
      // Создаем временный элемент для рендеринга
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.color = 'black';
      
      // Генерируем HTML контент
      let htmlContent = '';
      
      if (doc.type === 'route_sheet') {
        // Единый маршрутный лист с информацией для обеих сторон
        const doctorsList = doctors && doctors.length > 0 ? doctors : [];
        const employeesList = employees && employees.length > 0 ? employees : [];
        
        // Безопасная обработка списка работников
        let employeesTableRows = '';
        if (employeesList.length > 0) {
          try {
            employeesTableRows = employeesList.map((e: Employee, idx: number) => {
              try {
                const rules = resolveFactorRules(e.harmfulFactor || '');
                // Объединяем всех врачей из всех найденных правил, убираем дубликаты
                const allDoctors = rules.flatMap((r: any) => r.specialties || []);
                const doctorsForEmployee = Array.from(new Set(allDoctors)).join(', ');
                // Персонализируем исследования для каждого сотрудника с учетом стажа и других параметров
                const personalizedResearchList: string[] = [];
                for (const rule of rules) {
                  if (rule.research && rule.research.trim()) {
                    const personalized = personalizeResearch(rule.research, e);
                    if (personalized.trim().length > 0) {
                      personalizedResearchList.push(personalized);
                    }
                  }
                }
                // Объединяем персонализированные исследования, убираем дубликаты
                const uniqueResearch = Array.from(new Set(personalizedResearchList));
                const researchForEmployee = uniqueResearch.join('; ') || '—';
                return `
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px;">${idx + 1}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${(e.name || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${(e.position || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${(e.harmfulFactor || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${(doctorsForEmployee || '—').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td style="border: 1px solid #000; padding: 4px; font-size: 8px;">${(researchForEmployee || '—').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                  </tr>
                `;
              } catch (err) {
                console.error('Error processing employee:', e, err);
                return `
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px;">${idx + 1}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${(e.name || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${(e.position || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${(e.harmfulFactor || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td style="border: 1px solid #000; padding: 4px;">—</td>
                    <td style="border: 1px solid #000; padding: 4px;">—</td>
                  </tr>
                `;
              }
            }).join('');
          } catch (err) {
            console.error('Error generating employees table:', err);
            employeesTableRows = '<tr><td colspan="6" style="border: 1px solid #000; padding: 4px; text-align: center;">Ошибка при формировании списка работников</td></tr>';
          }
        } else {
          employeesTableRows = '<tr><td colspan="6" style="border: 1px solid #000; padding: 4px; text-align: center;">Список работников пуст</td></tr>';
        }
        
        htmlContent = `
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 0;">МАРШРУТНЫЙ ЛИСТ</h1>
          </div>
          <div style="margin-bottom: 20px;">
            <p><strong>Договор:</strong> ${contract.number || '-'}</p>
            <p><strong>Организация (Заказчик):</strong> ${contract.clientName || '-'}</p>
            <p><strong>Медицинская организация (Клиника):</strong> ${contract.clinicName || '-'}</p>
            <p><strong>Период проведения осмотра:</strong> ${contract.calendarPlan?.startDate || ''} - ${contract.calendarPlan?.endDate || ''}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 10px;">ПОРЯДОК ПРОВЕДЕНИЯ МЕДИЦИНСКОГО ОСМОТРА:</h3>
            <ol style="padding-left: 20px;">
              <li>Регистрация работников и проверка документов</li>
              <li>Предварительный осмотр врача-терапевта</li>
              <li>Осмотры врачей-специалистов согласно вредным факторам</li>
              <li>Лабораторные исследования (по показаниям)</li>
              <li>Функциональная диагностика (по показаниям)</li>
              <li>Заключительный осмотр председателя врачебной комиссии</li>
              <li>Оформление и выдача заключений о пригодности</li>
            </ol>
          </div>
          
          ${doctorsList.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-weight: bold; margin-bottom: 10px;">СОСТАВ ВРАЧЕБНОЙ КОМИССИИ:</h3>
              <ul style="padding-left: 20px;">
                ${doctorsList.map((d: any) => `<li>${(d.specialty || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}: ${(d.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}${d.isChairman ? ' (Председатель)' : ''}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 10px;">СПИСОК РАБОТНИКОВ И НАЗНАЧЕННЫЕ ВРАЧИ:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;">№</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;">ФИО</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;">Должность</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;">Вредность</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;">Врачи для осмотра</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;">Лабораторные и функциональные исследования</th>
                </tr>
              </thead>
              <tbody>
                ${employeesTableRows}
              </tbody>
            </table>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="font-weight: bold; margin-bottom: 10px;">ОБЯЗАННОСТИ ОРГАНИЗАЦИИ (РАБОТОДАТЕЛЯ):</h3>
            <ol style="padding-left: 20px;">
              <li>Предоставить список работников (Приложение 3 к договору)</li>
              <li>Обеспечить явку работников в назначенное время</li>
              <li>Предоставить характеристики условий труда на рабочих местах</li>
              <li>Организовать транспорт для доставки работников (при необходимости)</li>
              <li>Получить результаты медицинского осмотра</li>
              <li>Обеспечить выполнение рекомендаций врачебной комиссии</li>
            </ol>
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 15px;">
            <p><strong>Дата составления:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
            <div style="margin-top: 20px; display: flex; justify-content: space-between;">
              <div>
                <p>Главный врач медицинской организации:</p>
                <p style="margin-top: 30px;">_________________________</p>
                <p>М.П.</p>
              </div>
              <div>
                <p>Руководитель организации (работодатель):</p>
                <p style="margin-top: 30px;">_________________________</p>
                <p>М.П.</p>
              </div>
            </div>
          </div>
        `;
      } else if (doc.type === 'order') {
        const chairman = doctors.find((d: any) => d.isChairman);
        const members = doctors.filter((d: any) => !d.isChairman);
        htmlContent = `
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 0;">ПРИКАЗ</h1>
            <p style="font-size: 14px; margin: 5px 0 0 0;">О составе врачебной комиссии для проведения периодического медицинского осмотра</p>
          </div>
          <div style="margin-bottom: 20px;">
            <p><strong>Договор:</strong> ${contract.number}</p>
            <p><strong>Организация:</strong> ${contract.clientName}</p>
            <p><strong>Период:</strong> ${contract.calendarPlan?.startDate || ''} - ${contract.calendarPlan?.endDate || ''}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <p>В соответствии с требованиями законодательства Республики Казахстан о проведении периодических медицинских осмотров работников, занятых на работах с вредными и (или) опасными производственными факторами:</p>
            <p style="font-weight: bold; margin-top: 15px;">ПРИКАЗЫВАЮ:</p>
            <p style="margin-top: 10px;">1. Создать врачебную комиссию в следующем составе:</p>
            ${chairman ? `
              <p style="margin-left: 20px; margin-top: 10px;"><strong>Председатель комиссии:</strong></p>
              <p style="margin-left: 40px;">${chairman.specialty}: ${chairman.name}</p>
            ` : ''}
            ${members.length > 0 ? `
              <p style="margin-left: 20px; margin-top: 10px;"><strong>Члены комиссии:</strong></p>
              ${members.map((d: any) => `<p style="margin-left: 40px;">${d.specialty}: ${d.name}</p>`).join('')}
            ` : ''}
            ${doctors.length === 0 ? `
              <p style="margin-left: 20px; margin-top: 10px;"><strong>Председатель комиссии:</strong></p>
              <p style="margin-left: 40px;">Врач-профпатолог: _________________________</p>
              <p style="margin-left: 20px; margin-top: 10px;"><strong>Члены комиссии:</strong></p>
              <p style="margin-left: 40px;">Терапевт: _________________________</p>
              <p style="margin-left: 40px;">(Другие специалисты согласно вредным факторам)</p>
            ` : ''}
            <p style="margin-top: 15px;">2. Комиссии провести медицинский осмотр работников ${contract.clientName} в период с ${contract.calendarPlan?.startDate || ''} по ${contract.calendarPlan?.endDate || ''}.</p>
            <p>3. По результатам осмотра составить заключительный акт и план оздоровительных мероприятий.</p>
            <p>4. Контроль за исполнением приказа возложить на заместителя главного врача по медицинской части.</p>
          </div>
          <div style="margin-top: 30px;">
            <p>Главный врач: _________________________</p>
            <p style="margin-top: 10px;">Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
            <p style="margin-top: 10px;">М.П.</p>
          </div>
        `;
      } else {
        // Для других типов документов используем старый метод
        let pdfDoc;
        let filename = '';
        
        switch (doc.type) {
          case 'final_act':
            pdfDoc = generateFinalActPDF(contract, employees);
            filename = `Заключительный_акт_${contract.number}.pdf`;
            break;
          case 'health_plan':
            pdfDoc = generateHealthPlanPDF(contract, employees);
            filename = `План_оздоровления_${contract.number}.pdf`;
            break;
          default:
            showToast('error', 'Неизвестный тип документа');
            return;
        }
        
        if (pdfDoc) {
          pdfDoc.save(filename);
          showToast('success', 'Документ скачан');
          return;
        }
      }
      
      if (htmlContent) {
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);
        
        try {
          // Ждем, чтобы элемент полностью отрендерился
          // Для маршрутного листа с таблицей нужна большая задержка
          const delay = doc.type === 'route_sheet' ? 800 : 300;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Дополнительная проверка для таблиц - ждем пока они загрузятся
          if (doc.type === 'route_sheet') {
            const tables = tempDiv.querySelectorAll('table');
            if (tables.length > 0) {
              // Ждем еще немного для больших таблиц
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // Используем html2canvas с параметрами, оптимизированными для больших таблиц
          // Для маршрутного листа используем меньший масштаб и ограничиваем размер
          const isRouteSheet = doc.type === 'route_sheet';
          const scale = isRouteSheet ? 0.8 : 1.5; // Значительно уменьшаем масштаб для маршрутного листа
          
          // Ограничиваем максимальную ширину для маршрутного листа
          const maxWidth = isRouteSheet ? 1200 : undefined;
          const elementWidth = tempDiv.offsetWidth || tempDiv.scrollWidth;
          const elementHeight = tempDiv.offsetHeight || tempDiv.scrollHeight;
          const finalWidth = maxWidth && elementWidth > maxWidth ? maxWidth : elementWidth;
          
          const sourceCanvas = await html2canvas(tempDiv, {
            scale: scale,
            useCORS: false,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: false,
            removeContainer: false,
            width: finalWidth,
            height: elementHeight,
            windowWidth: finalWidth,
            windowHeight: elementHeight,
            onclone: (clonedDoc) => {
              // Убеждаемся, что все стили применены
              const clonedElement = clonedDoc.querySelector('div');
              if (clonedElement) {
                clonedElement.style.visibility = 'visible';
                clonedElement.style.display = 'block';
                clonedElement.style.overflow = 'visible';
                // Для таблиц убеждаемся, что они видны
                const tables = clonedElement.querySelectorAll('table');
                tables.forEach((table: any) => {
                  table.style.visibility = 'visible';
                  table.style.display = 'table';
                  table.style.width = '100%';
                });
              }
            }
          });
          
          // Проверяем, что canvas валиден
          if (!sourceCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) {
            throw new Error('Не удалось создать изображение: canvas пустой');
          }
          
          // Создаем новый canvas и копируем данные (это может помочь обойти блокировку)
          const newCanvas = document.createElement('canvas');
          newCanvas.width = sourceCanvas.width;
          newCanvas.height = sourceCanvas.height;
          const ctx = newCanvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Не удалось получить контекст canvas');
          }
          
          // Копируем изображение на новый canvas
          ctx.drawImage(sourceCanvas, 0, 0);
          
          // Конвертируем новый canvas в изображение
          // Для маршрутного листа используем JPEG с низким качеством для уменьшения размера файла
          let imgData: string;
          let imageFormat: 'PNG' | 'JPEG' = isRouteSheet ? 'JPEG' : 'PNG';
          
          try {
            if (isRouteSheet) {
              // Для маршрутного листа сразу используем JPEG с качеством 0.7 для уменьшения размера
              imgData = newCanvas.toDataURL('image/jpeg', 0.7);
              if (!imgData || imgData.length < 100 || !imgData.startsWith('data:image/jpeg')) {
                throw new Error('JPEG конвертация вернула невалидные данные');
              }
            } else {
              // Для других документов пробуем PNG
              imgData = newCanvas.toDataURL('image/png');
              if (!imgData || imgData.length < 100 || !imgData.startsWith('data:image/png')) {
                throw new Error('PNG конвертация вернула невалидные данные');
              }
            }
          } catch (primaryError) {
            console.warn('Первичная конвертация не удалась, пробуем альтернативный формат:', primaryError);
            try {
              // Fallback на JPEG с еще более низким качеством
              imgData = newCanvas.toDataURL('image/jpeg', isRouteSheet ? 0.6 : 0.85);
              imageFormat = 'JPEG';
              if (!imgData || imgData.length < 100 || !imgData.startsWith('data:image/jpeg')) {
                throw new Error('JPEG конвертация вернула невалидные данные');
              }
            } catch (jpegError) {
              console.error('Оба формата не удались:', { primaryError, jpegError });
              // Последняя попытка - используем исходный canvas напрямую
              try {
                imgData = sourceCanvas.toDataURL('image/jpeg', isRouteSheet ? 0.6 : 0.85);
                imageFormat = 'JPEG';
                if (!imgData || imgData.length < 100) {
                  throw new Error('Все методы конвертации не удались');
                }
              } catch (finalError) {
                throw new Error('Не удалось конвертировать canvas в изображение. Попробуйте обновить страницу и повторить попытку.');
              }
            }
          }
          
          // Используем исходный canvas для размеров
          const canvas = sourceCanvas;
          
          // Безопасное удаление элемента после успешной конвертации
          if (tempDiv.parentNode === document.body) {
            document.body.removeChild(tempDiv);
          }
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;
          
          pdf.addImage(imgData, imageFormat, 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, imageFormat, 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          let filename = '';
          if (doc.type === 'route_sheet') {
            filename = `Маршрутный_лист_${contract.number}.pdf`;
          } else if (doc.type === 'order') {
            filename = `Приказ_врачебная_комиссия_${contract.number}.pdf`;
          }
          
          pdf.save(filename);
          showToast('success', 'Документ скачан');
        } catch (err) {
          // Безопасное удаление элемента в случае ошибки
          if (tempDiv.parentNode === document.body) {
            document.body.removeChild(tempDiv);
          }
          console.error('PDF generation error:', err);
          console.error('Document type:', doc.type);
          console.error('Error details:', {
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined,
            name: err instanceof Error ? err.name : undefined
          });
          const errorMessage = err instanceof Error 
            ? `Ошибка при создании PDF: ${err.message}` 
            : 'Неизвестная ошибка при создании PDF';
          showToast('error', errorMessage);
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      showToast('error', 'Ошибка при создании PDF документа');
    }
  }, [contract, employees, doctors, resolveFactorRules, showToast]);



  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'final_act':
      case 'health_plan':
        return <FileTextIcon className="w-4 h-4" />;
      case 'route_sheet':
        return <FileSignatureIcon className="w-4 h-4" />;
      case 'order':
        return <UserMdIcon className="w-4 h-4" />;
      default:
        return <FileTextIcon className="w-4 h-4" />;
    }
  };

  return (
    <>
      <section className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileTextIcon className="w-5 h-5" />
            Документы
          </h3>
          <div className="flex gap-2 flex-wrap">
            {employees.length > 0 && currentUser?.role === 'clinic' && (
              <button
                onClick={handleGenerateRouteSheetsAndOrder}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                title="Сформировать маршрутный лист и приказ"
              >
                <FileSignatureIcon className="w-3 h-3" />
                Маршрутный лист
              </button>
            )}
            {currentUser?.role === 'clinic' && isExamFinished && (
              <>
                <button
                  onClick={handleGenerateReports}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1"
                >
                  <FileTextIcon className="w-3 h-3" />
                  Сформировать отчеты
                </button>
                <button
                  onClick={() => setIsNamedListsModalOpen(true)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all flex items-center gap-1"
                  title="Управление поименными списками (п.15)"
                >
                  Поименные списки
                </button>
                <button
                  onClick={() => setIsSummaryReportModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1"
                  title="Сводный отчет (п.17)"
                >
                  Сводный отчет
                </button>
                <button
                  onClick={() => setIsEmergencyNoticesModalOpen(true)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1"
                  title="Экстренные извещения (п.19)"
                >
                  Экстренные извещения
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Документы будут сформированы автоматически</p>
            </div>
          ) : (
            documents
              .filter(doc => {
                // Приказ виден только клинике
                if (doc.type === 'order' && currentUser?.role !== 'clinic') {
                  return false;
                }
                return true;
              })
              // Фильтруем дубликаты маршрутных листов - оставляем только один
              .reduce((acc: ContractDocument[], doc) => {
                if (doc.type === 'route_sheet') {
                  // Если уже есть маршрутный лист, пропускаем остальные
                  const hasRouteSheet = acc.some(d => d.type === 'route_sheet');
                  if (hasRouteSheet) {
                    return acc;
                  }
                }
                acc.push(doc);
                return acc;
              }, [])
              .map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {doc.type === 'route_sheet' && (doc.title.includes('(Клиника)') || doc.title.includes('(Организация)'))
                          ? 'Маршрутный лист'
                          : doc.title}
                      </p>
                      <p className="text-xs text-slate-500">{doc.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewDocument(doc)}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      Просмотр
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Скачать PDF
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>

        {contract.calendarPlan?.status === 'approved' && documents.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-semibold mb-2">
              ✓ План утверждён. Документы готовы:
            </p>
            <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
              {documents
                .filter(d => {
                  if (d.type === 'route_sheet') return true;
                  // Приказ виден только клинике
                  if (d.type === 'order' && currentUser?.role === 'clinic') return true;
                  return false;
                })
                // Фильтруем дубликаты маршрутных листов
                .reduce((acc: ContractDocument[], doc) => {
                  if (doc.type === 'route_sheet') {
                    const hasRouteSheet = acc.some(d => d.type === 'route_sheet');
                    if (hasRouteSheet) {
                      return acc;
                    }
                  }
                  acc.push(doc);
                  return acc;
                }, [])
                .map(doc => (
                  <li key={doc.id}>{doc.title.includes('(Клиника)') || doc.title.includes('(Организация)') ? 'Маршрутный лист' : doc.title}</li>
                ))}
            </ul>
            <p className="text-xs text-green-600 mt-2">
              Используйте кнопки "Просмотр" или "Скачать PDF" для работы с документами
            </p>
          </div>
        )}
        
        {contract.calendarPlan?.status === 'approved' && documents.length === 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 font-medium">
              ⚠ Документы должны были быть созданы автоматически. Если их нет, обратитесь в поддержку.
            </p>
          </div>
        )}
      </section>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          contract={contract}
          employees={employees}
          doctors={doctors}
          resolveFactorRules={resolveFactorRules}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => {
            setPreviewDoc(null);
            handleDownloadDocument(previewDoc);
          }}
        />
      )}

      {/* Final Reports Modal */}
      {isReportModalOpen && (
        <FinalReportsModal
          reportForm={reportForm}
          setReportForm={setReportForm}
          isSavingReport={isSavingReport}
          onClose={() => setIsReportModalOpen(false)}
          onSave={handleSaveReports}
        />
      )}

      {/* Named Lists Modal - Поименные списки (п.15) */}
      {isNamedListsModalOpen && contract && (
        <NamedListsModal
          contract={contract}
          employees={employees}
          onClose={() => setIsNamedListsModalOpen(false)}
          showToast={showToast}
        />
      )}

      {/* Summary Report Modal - Сводный отчет (п.17) */}
      {isSummaryReportModalOpen && contract && (
        <SummaryReportModal
          contract={contract}
          employees={employees}
          onClose={() => setIsSummaryReportModalOpen(false)}
          showToast={showToast}
        />
      )}

      {/* Emergency Notices Modal - Экстренные извещения (п.19) */}
      {isEmergencyNoticesModalOpen && contract && (
        <EmergencyNoticesModal
          contract={contract}
          employees={employees}
          onClose={() => setIsEmergencyNoticesModalOpen(false)}
          showToast={showToast}
        />
      )}
    </>
  );
};

// --- DOCUMENT PREVIEW MODAL ---
interface DocumentPreviewModalProps {
  doc: ContractDocument;
  contract: Contract;
  employees: Employee[];
  doctors: any[];
  resolveFactorRules: (text: string) => any[];
  onClose: () => void;
  onDownload: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  doc,
  contract,
  employees,
  doctors,
  resolveFactorRules,
  onClose,
  onDownload
}) => {
  const renderRouteSheet = () => {
    const doctorsList = doctors && doctors.length > 0 ? doctors : [];
    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold mb-2">МАРШРУТНЫЙ ЛИСТ</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div><span className="font-semibold">Договор:</span> {contract.number}</div>
          <div><span className="font-semibold">Организация (Заказчик):</span> {contract.clientName}</div>
          <div><span className="font-semibold">Медицинская организация (Клиника):</span> {contract.clinicName}</div>
          <div><span className="font-semibold">Период проведения осмотра:</span> {contract.calendarPlan?.startDate} - {contract.calendarPlan?.endDate}</div>
        </div>

        <div>
          <h3 className="font-bold mb-3">ПОРЯДОК ПРОВЕДЕНИЯ МЕДИЦИНСКОГО ОСМОТРА:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Регистрация работников и проверка документов</li>
            <li>Предварительный осмотр врача-терапевта</li>
            <li>Осмотры врачей-специалистов согласно вредным факторам</li>
            <li>Лабораторные исследования (по показаниям)</li>
            <li>Функциональная диагностика (по показаниям)</li>
            <li>Заключительный осмотр председателя врачебной комиссии</li>
            <li>Оформление и выдача заключений о пригодности</li>
          </ol>
        </div>

        {doctorsList.length > 0 && (
          <div>
            <h3 className="font-bold mb-3">СОСТАВ ВРАЧЕБНОЙ КОМИССИИ:</h3>
            <ul className="space-y-2 text-sm">
              {doctorsList.map((doctor: any, idx: number) => (
                <li key={idx}>
                  {doctor.specialty}: {doctor.name}
                  {doctor.isChairman && ' (Председатель)'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="font-bold mb-3">СПИСОК РАБОТНИКОВ И НАЗНАЧЕННЫЕ ВРАЧИ:</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-left">№</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">ФИО</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Должность</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Вредность</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Врачи для осмотра</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Лабораторные и функциональные исследования</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e, idx) => {
                  const rules = resolveFactorRules(e.harmfulFactor || '');
                  // Объединяем всех врачей из всех найденных правил, убираем дубликаты
                  const allDoctors = rules.flatMap((r: FactorRule) => r.specialties || []);
                  const doctorsForEmployee = Array.from(new Set(allDoctors)).join(', ');
                  // Персонализируем исследования для каждого сотрудника с учетом стажа и других параметров
                  const personalizedResearchList: string[] = [];
                  for (const rule of rules) {
                    if (rule.research && rule.research.trim()) {
                      const personalized = personalizeResearch(rule.research, e);
                      if (personalized.trim().length > 0) {
                        personalizedResearchList.push(personalized);
                      }
                    }
                  }
                  // Объединяем персонализированные исследования, убираем дубликаты
                  const uniqueResearch = Array.from(new Set(personalizedResearchList));
                  const researchForEmployee = uniqueResearch.join('; ') || '—';
                  return (
                    <tr key={e.id}>
                      <td className="border border-slate-300 px-3 py-2">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2">{e.name}</td>
                      <td className="border border-slate-300 px-3 py-2">{e.position || '-'}</td>
                      <td className="border border-slate-300 px-3 py-2 text-amber-700">{e.harmfulFactor || '-'}</td>
                      <td className="border border-slate-300 px-3 py-2 text-slate-700">
                        {doctorsForEmployee || '—'}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-slate-700 text-[10px]">
                        {researchForEmployee}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">ОБЯЗАННОСТИ ОРГАНИЗАЦИИ (РАБОТОДАТЕЛЯ):</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Предоставить список работников (Приложение 3 к договору)</li>
            <li>Обеспечить явку работников в назначенное время</li>
            <li>Предоставить характеристики условий труда на рабочих местах</li>
            <li>Организовать транспорт для доставки работников (при необходимости)</li>
            <li>Получить результаты медицинского осмотра</li>
            <li>Обеспечить выполнение рекомендаций врачебной комиссии</li>
          </ol>
        </div>
      </div>
    );
  };

  const renderOrder = () => {
    const chairman = doctors.find((d: any) => d.isChairman);
    const members = doctors.filter((d: any) => !d.isChairman);

    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold mb-2">ПРИКАЗ</h2>
          <p className="text-sm text-slate-600">
            О составе врачебной комиссии для проведения периодического медицинского осмотра
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div><span className="font-semibold">Договор:</span> {contract.number}</div>
          <div><span className="font-semibold">Организация:</span> {contract.clientName}</div>
          <div><span className="font-semibold">Период:</span> {contract.calendarPlan?.startDate} - {contract.calendarPlan?.endDate}</div>
        </div>

        <div className="text-sm space-y-3">
          <p>
            В соответствии с требованиями законодательства Республики Казахстан о проведении периодических медицинских осмотров работников, занятых на работах с вредными и (или) опасными производственными факторами:
          </p>

          <div>
            <p className="font-bold mb-2">ПРИКАЗЫВАЮ:</p>
            <p className="mb-2">1. Создать врачебную комиссию в следующем составе:</p>
            
            {chairman && (
              <div className="ml-4 mb-2">
                <p className="font-semibold">Председатель комиссии:</p>
                <p className="ml-4">{chairman.specialty}: {chairman.name}</p>
              </div>
            )}

            {members.length > 0 && (
              <div className="ml-4 mb-2">
                <p className="font-semibold">Члены комиссии:</p>
                {members.map((doctor: any, idx: number) => (
                  <p key={idx} className="ml-4">{doctor.specialty}: {doctor.name}</p>
                ))}
              </div>
            )}

            {doctors.length === 0 && (
              <div className="ml-4 mb-2">
                <p className="font-semibold">Председатель комиссии:</p>
                <p className="ml-4">Врач-профпатолог: _________________________</p>
                <p className="font-semibold mt-2">Члены комиссии:</p>
                <p className="ml-4">Терапевт: _________________________</p>
                <p className="ml-4">(Другие специалисты согласно вредным факторам)</p>
              </div>
            )}

            <p className="mt-4 mb-2">
              2. Комиссии провести медицинский осмотр работников {contract.clientName} в период с {contract.calendarPlan?.startDate} по {contract.calendarPlan?.endDate}.
            </p>
            <p className="mb-2">
              3. По результатам осмотра составить заключительный акт и план оздоровительных мероприятий.
            </p>
            <p className="mb-2">
              4. Контроль за исполнением приказа возложить на заместителя главного врача по медицинской части.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <p>Главный врач: _________________________</p>
            <p>Дата: {new Date().toLocaleDateString('ru-RU')}</p>
            <p>М.П.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold">
            {doc.type === 'route_sheet' && (doc.title.includes('(Клиника)') || doc.title.includes('(Организация)'))
              ? 'Маршрутный лист'
              : doc.title}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
            >
              Скачать PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-2xl">✕</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          {doc.type === 'route_sheet' && renderRouteSheet()}
          {doc.type === 'order' && renderOrder()}
          {doc.type === 'final_act' && (
            <div className="text-sm space-y-3">
              <h2 className="text-2xl font-bold text-center mb-4">ЗАКЛЮЧИТЕЛЬНЫЙ АКТ</h2>
              <p className="text-center mb-4">
                по результатам проведенного периодического медицинского осмотра работников {contract.clientName}
              </p>
              <div className="space-y-2">
                <p>1. Медицинская организация: {contract.clinicName}</p>
                <p>2. Организация (Заказчик): {contract.clientName}</p>
                <p>3. Всего работников, подлежащих осмотру: {employees.length}</p>
                <p>4. Всего осмотрено: {employees.filter(e => e.status !== 'pending').length}</p>
                <p>   - Признаны годными к работе: {employees.filter(e => e.status === 'fit').length}</p>
                <p>   - Нуждаются в дообследовании: {employees.filter(e => e.status === 'needs_observation').length}</p>
                <p>   - Имеют противопоказания к работе: {employees.filter(e => e.status === 'unfit').length}</p>
              </div>
            </div>
          )}
          {doc.type === 'health_plan' && (
            <div className="text-sm space-y-3">
              <h2 className="text-2xl font-bold text-center mb-4">ПЛАН ОЗДОРОВЛЕНИЯ</h2>
              <p className="text-center mb-4">
                работников {contract.clientName} по результатам периодического медицинского осмотра
              </p>
              <div>
                <p className="font-semibold mb-2">Список сотрудников, подлежащих оздоровлению:</p>
                {employees.filter(e => e.status === 'needs_observation' || e.status === 'unfit').length > 0 ? (
                  <ul className="list-decimal list-inside space-y-1">
                    {employees.filter(e => e.status === 'needs_observation' || e.status === 'unfit').map((e, idx) => (
                      <li key={e.id}>
                        {e.name} ({e.position}) - {e.status === 'unfit' ? 'Противопоказан' : 'Наблюдение'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Нет сотрудников, требующих оздоровительных мероприятий.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- FINAL REPORTS MODAL ---
interface FinalReportsModalProps {
  reportForm: {
    finalAct: string;
    healthPlan: string;
  };
  setReportForm: (form: any) => void;
  isSavingReport: boolean;
  onClose: () => void;
  onSave: () => void;
}

const FinalReportsModal: React.FC<FinalReportsModalProps> = ({
  reportForm,
  setReportForm,
  isSavingReport,
  onClose,
  onSave
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col animate-fade-in-up">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-xl font-bold">Заключительные документы</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
      </div>
      
      <div className="flex-1 overflow-auto p-8 grid grid-cols-2 gap-8">
        <div className="flex flex-col h-full">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
            <FileTextIcon className="w-4 h-4" /> Заключительный акт (Приложение 1)
          </label>
          <textarea 
            value={reportForm.finalAct}
            onChange={e => setReportForm({...reportForm, finalAct: e.target.value})}
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed outline-none resize-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col h-full">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
            <UserMdIcon className="w-4 h-4" /> План оздоровления
          </label>
          <textarea 
            value={reportForm.healthPlan}
            onChange={e => setReportForm({...reportForm, healthPlan: e.target.value})}
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed outline-none resize-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
        <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">
          Отмена
        </button>
        <button 
          onClick={onSave} 
          disabled={isSavingReport} 
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          {isSavingReport ? <LoaderIcon className="w-4 h-4 animate-spin"/> : 'Сохранить и Завершить'}
        </button>
      </div>
    </div>
  </div>
);

// --- НОВЫЕ МОДАЛЬНЫЕ ОКНА ДЛЯ РАСШИРЕННОГО ФУНКЦИОНАЛА ---

// Поименные списки (п.15 Приказа)
interface NamedListsModalProps {
  contract: Contract;
  employees: Employee[];
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const NamedListsModal: React.FC<NamedListsModalProps> = ({ contract, employees, onClose, showToast }) => {
  const [lists, setLists] = React.useState<NamedLists>({
    transferToOtherWork: [],
    hospitalTreatment: [],
    sanatoriumTreatment: [],
    therapeuticNutrition: [],
    dynamicObservation: []
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const loadLists = async () => {
      try {
        const { apiGetNamedLists } = await import('../services/api');
        const data = await apiGetNamedLists(Number(contract.id));
        setLists(data);
      } catch (e) {
        const unfitEmployees = employees.filter(e => e.status === 'unfit').map(e => `${e.name} (${e.position})`);
        const observationEmployees = employees.filter(e => e.status === 'needs_observation').map(e => `${e.name} (${e.position})`);
        setLists({
          transferToOtherWork: unfitEmployees.slice(0, Math.ceil(unfitEmployees.length / 2)),
          hospitalTreatment: unfitEmployees.slice(Math.ceil(unfitEmployees.length / 2)),
          sanatoriumTreatment: [],
          therapeuticNutrition: [],
          dynamicObservation: observationEmployees
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadLists();
  }, [contract.id, employees]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { apiUpdateNamedLists } = await import('../services/api');
      await apiUpdateNamedLists(Number(contract.id), lists);
      showToast('success', 'Поименные списки сохранены');
      onClose();
    } catch (e) {
      showToast('error', 'Ошибка сохранения поименных списков');
    } finally {
      setIsSaving(false);
    }
  };

  const addEmployee = (category: keyof NamedLists, employeeName: string) => {
    if (employeeName.trim()) {
      setLists(prev => ({
        ...prev,
        [category]: [...prev[category], employeeName.trim()]
      }));
    }
  };

  const removeEmployee = (category: keyof NamedLists, index: number) => {
    setLists(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const categoryLabels: Record<keyof NamedLists, string> = {
    transferToOtherWork: '1. Перевод на другую работу',
    hospitalTreatment: '2. Стационарное лечение',
    sanatoriumTreatment: '3. Санаторно-курортное лечение',
    therapeuticNutrition: '4. Лечебно-профилактическое питание',
    dynamicObservation: '5. Динамическое наблюдение'
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl p-8">
          <LoaderIcon className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold">Поименные списки (п.15 Приказа)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {(Object.keys(categoryLabels) as Array<keyof NamedLists>).map(category => (
            <div key={category} className="border border-slate-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-3">{categoryLabels[category]}</h4>
              <div className="space-y-2">
                {lists[category].map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm">{name}</span>
                    <button
                      onClick={() => removeEmployee(category, idx)}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Добавить ФИО сотрудника"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addEmployee(category, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addEmployee(category, input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            {isSaving ? <LoaderIcon className="w-4 h-4 animate-spin"/> : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Сводный отчет (п.17 Приказа)
interface SummaryReportModalProps {
  contract: Contract;
  employees: Employee[];
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const SummaryReportModal: React.FC<SummaryReportModalProps> = ({ contract, employees, onClose, showToast }) => {
  const [report, setReport] = React.useState<Omit<SummaryReport, 'contractId' | 'reportDate'>>({
    totalEmployees: employees.length,
    examinedEmployees: employees.filter(e => e.status !== 'pending').length,
    fitEmployees: employees.filter(e => e.status === 'fit').length,
    unfitEmployees: employees.filter(e => e.status === 'unfit').length,
    observationEmployees: employees.filter(e => e.status === 'needs_observation').length,
    categories: {
      healthy: 0,
      practicallyHealthy: 0,
      initialDiseases: 0,
      expressedDiseases: 0,
      harmfulFactors: 0,
      occupationalDiseases: 0
    },
    sentTo: ''
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { apiCreateSummaryReport } = await import('../services/api');
      await apiCreateSummaryReport(Number(contract.id), report);
      showToast('success', 'Сводный отчет сохранен');
      onClose();
    } catch (e) {
      showToast('error', 'Ошибка сохранения сводного отчета');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold">Сводный отчет (п.17 Приказа)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Всего работников</label>
              <input
                type="number"
                value={report.totalEmployees}
                onChange={(e) => setReport(prev => ({ ...prev, totalEmployees: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Осмотрено</label>
              <input
                type="number"
                value={report.examinedEmployees}
                onChange={(e) => setReport(prev => ({ ...prev, examinedEmployees: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Годны</label>
              <input
                type="number"
                value={report.fitEmployees}
                onChange={(e) => setReport(prev => ({ ...prev, fitEmployees: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Не годны</label>
              <input
                type="number"
                value={report.unfitEmployees}
                onChange={(e) => setReport(prev => ({ ...prev, unfitEmployees: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Классификация по п.21</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({
                healthy: 'Здоровые работники',
                practicallyHealthy: 'Практически здоровые',
                initialDiseases: 'Начальные формы заболеваний',
                expressedDiseases: 'Выраженные формы заболеваний',
                harmfulFactors: 'Признаки воздействия вредных факторов',
                occupationalDiseases: 'Признаки профессиональных заболеваний'
              }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-slate-700 mb-1">{label}</label>
                  <input
                    type="number"
                    value={report.categories[key as keyof typeof report.categories] || 0}
                    onChange={(e) => setReport(prev => ({
                      ...prev,
                      categories: { ...prev.categories, [key]: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Отправлено в</label>
            <input
              type="text"
              value={report.sentTo}
              onChange={(e) => setReport(prev => ({ ...prev, sentTo: e.target.value }))}
              placeholder="Территориальное подразделение"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            {isSaving ? <LoaderIcon className="w-4 h-4 animate-spin"/> : 'Сохранить и отправить'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Экстренные извещения (п.19 Приказа)
interface EmergencyNoticesModalProps {
  contract: Contract;
  employees: Employee[];
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const EmergencyNoticesModal: React.FC<EmergencyNoticesModalProps> = ({ contract, employees, onClose, showToast }) => {
  const [notices, setNotices] = React.useState<EmergencyNotice[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newNotice, setNewNotice] = React.useState({
    employeeId: '',
    employeeName: '',
    diseaseType: 'infectious' as 'infectious' | 'parasitic' | 'carrier',
    diseaseName: '',
    sentTo: ''
  });

  React.useEffect(() => {
    const loadNotices = async () => {
      try {
        const { apiListEmergencyNotices } = await import('../services/api');
        const data = await apiListEmergencyNotices(Number(contract.id));
        setNotices(data);
      } catch (e) {
        console.error('Failed to load emergency notices:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadNotices();
  }, [contract.id]);

  const handleCreate = async () => {
    if (!newNotice.employeeId || !newNotice.diseaseName || !newNotice.sentTo) {
      showToast('error', 'Заполните все обязательные поля');
      return;
    }
    setIsCreating(true);
    try {
      const { apiCreateEmergencyNotice } = await import('../services/api');
      const notice = await apiCreateEmergencyNotice(Number(contract.id), newNotice);
      setNotices(prev => [notice, ...prev]);
      setNewNotice({
        employeeId: '',
        employeeName: '',
        diseaseType: 'infectious',
        diseaseName: '',
        sentTo: ''
      });
      showToast('success', 'Экстренное извещение создано');
    } catch (e) {
      showToast('error', 'Ошибка создания экстренного извещения');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl p-8">
          <LoaderIcon className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold">Экстренные извещения (п.19 Приказа)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h4 className="font-bold text-slate-900 mb-4">Создать новое извещение</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">ИИН сотрудника</label>
                <input
                  type="text"
                  value={newNotice.employeeId}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    setNewNotice(prev => ({
                      ...prev,
                      employeeId: e.target.value,
                      employeeName: employee ? employee.name : prev.employeeName
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">ФИО сотрудника</label>
                <input
                  type="text"
                  value={newNotice.employeeName}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, employeeName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Тип заболевания</label>
                <select
                  value={newNotice.diseaseType}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, diseaseType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="infectious">Инфекционное заболевание</option>
                  <option value="parasitic">Паразитарное заболевание</option>
                  <option value="carrier">Носительство возбудителей</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Название заболевания</label>
                <input
                  type="text"
                  value={newNotice.diseaseName}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, diseaseName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Отправлено в</label>
                <input
                  type="text"
                  value={newNotice.sentTo}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, sentTo: e.target.value }))}
                  placeholder="Территориальное подразделение"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-2"
            >
              {isCreating ? <LoaderIcon className="w-4 h-4 animate-spin"/> : 'Создать извещение'}
            </button>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Отправленные извещения</h4>
            {notices.length === 0 ? (
              <p className="text-slate-400 text-sm">Нет отправленных извещений</p>
            ) : (
              <div className="space-y-2">
                {notices.map(notice => (
                  <div key={notice.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{notice.employeeName}</p>
                        <p className="text-sm text-slate-600">ИИН: {notice.employeeId}</p>
                        <p className="text-sm text-slate-600">Заболевание: {notice.diseaseName} ({notice.diseaseType === 'infectious' ? 'Инфекционное' : notice.diseaseType === 'parasitic' ? 'Паразитарное' : 'Носительство'})</p>
                        <p className="text-sm text-slate-600">Отправлено в: {notice.sentTo}</p>
                        <p className="text-xs text-slate-500">Дата: {notice.sentDate}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        notice.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {notice.status === 'sent' ? 'Отправлено' : 'Ожидает'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
          <button onClick={onClose} className="px-6 py-2 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};