import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Contract, Employee, DoctorRouteSheet, DoctorExamination, AmbulatoryCard } from '../types';
import { 
  LoaderIcon, 
  SearchIcon, 
  UserMdIcon, 
  LogoutIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FileTextIcon,
  CheckShieldIcon,
  BriefcaseIcon
} from './Icons';
import BrandLogo from './BrandLogo';
import {
  apiListContractsByBin,
  apiListRouteSheets,
  apiUpdateRouteSheet,
  apiGetAmbulatoryCard,
  apiCreateAmbulatoryCard,
  apiUpdateAmbulatoryCard,
  ApiRouteSheet,
  ApiAmbulatoryCard
} from '../services/api';

interface DoctorWorkspaceProps {
  currentUser: UserProfile;
}

const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [routeSheet, setRouteSheet] = useState<DoctorRouteSheet | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [ambulatoryCard, setAmbulatoryCard] = useState<AmbulatoryCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [examinationForm, setExaminationForm] = useState({
    complaints: '',
    objectiveExamination: '',
    diagnosis: '',
    conclusion: '',
    recommendations: '',
    isFit: true,
  });

  // Загрузка договоров
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser.clinicBin && !currentUser.bin) {
        setIsLoading(false);
        return;
      }

      try {
        const bin = currentUser.clinicBin || currentUser.bin;
        if (!bin) return;

        const contractsList = await apiListContractsByBin(bin);
        const contractsData: Contract[] = contractsList
          .filter(c => c.status === 'execution' || c.status === 'planning')
          .map(c => ({
            id: String(c.id),
            number: c.number,
            clientName: c.clientName,
            clientBin: c.clientBin,
            clientSigned: c.clientSigned,
            clinicName: c.clinicName,
            clinicBin: c.clinicBin,
            clinicSigned: c.clinicSigned,
            date: c.date,
            status: c.status as any,
            price: c.price,
            plannedHeadcount: c.plannedHeadcount,
            employees: c.employees || [],
            documents: c.documents || [],
            calendarPlan: c.calendarPlan,
          }));
        
        setContracts(contractsData);
        if (contractsData.length > 0) {
          setSelectedContract(contractsData[0]);
        }
      } catch (error) {
        console.error('Error loading contracts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Загрузка маршрутного листа
  useEffect(() => {
    const loadRouteSheet = async () => {
      if (!selectedContract || !currentUser.doctorId) return;

      try {
        const contractIdNum = parseInt(selectedContract.id, 10);
        if (isNaN(contractIdNum)) return;

        const apiSheets = await apiListRouteSheets({ contractId: contractIdNum });
        const mySheet = apiSheets.find(s => s.doctorId === currentUser.doctorId);
        
        if (mySheet) {
          const sheet: DoctorRouteSheet = {
            id: String(mySheet.id),
            doctorId: mySheet.doctorId,
            contractId: String(mySheet.contractId),
            specialty: mySheet.specialty,
            virtualDoctor: mySheet.virtualDoctor,
            employees: mySheet.employees,
            createdAt: mySheet.createdAt,
          };
          setRouteSheet(sheet);
        }
      } catch (error) {
        console.error('Error loading route sheet:', error);
      }
    };

    loadRouteSheet();
  }, [selectedContract, currentUser.doctorId]);

  // Загрузка амбулаторной карты при выборе сотрудника
  useEffect(() => {
    const loadCard = async () => {
      if (!selectedEmployee || !selectedContract) return;

      try {
        const contractIdNum = parseInt(selectedContract.id, 10);
        if (isNaN(contractIdNum)) return;

        let apiCard = await apiGetAmbulatoryCard(selectedEmployee.id, contractIdNum);
        
        if (!apiCard) {
          apiCard = await apiCreateAmbulatoryCard({
            employeeId: selectedEmployee.id,
            contractId: contractIdNum,
            personalInfo: {
              fullName: selectedEmployee.name,
              dateOfBirth: selectedEmployee.dob,
              gender: selectedEmployee.gender || 'М',
              workplace: selectedContract.clientName,
              position: selectedEmployee.position,
              harmfulFactors: selectedEmployee.harmfulFactor || '',
            },
            examinations: {},
          });
        }

        if (apiCard) {
          const card: AmbulatoryCard = {
            employeeId: apiCard.employeeId,
            contractId: apiCard.contractId ? String(apiCard.contractId) : undefined,
            cardNumber: apiCard.cardNumber,
            personalInfo: apiCard.personalInfo as any,
            anamnesis: apiCard.anamnesis as any,
            vitals: apiCard.vitals as any,
            labTests: apiCard.labTests as any,
            examinations: apiCard.examinations as any,
            finalConclusion: apiCard.finalConclusion as any,
            createdAt: apiCard.createdAt,
            updatedAt: apiCard.updatedAt,
          };
          setAmbulatoryCard(card);

          // Загружаем данные осмотра, если есть
          const specialty = currentUser.specialty || '';
          const existingExam = card.examinations[specialty] as DoctorExamination | undefined;
          if (existingExam) {
            setExaminationForm({
              complaints: existingExam.complaints || '',
              objectiveExamination: existingExam.objectiveExamination || '',
              diagnosis: existingExam.diagnosis || '',
              conclusion: existingExam.conclusion || '',
              recommendations: existingExam.recommendations || '',
              isFit: existingExam.isFit ?? true,
            });
          } else {
            setExaminationForm({
              complaints: '',
              objectiveExamination: '',
              diagnosis: '',
              conclusion: '',
              recommendations: '',
              isFit: true,
            });
          }
        }
      } catch (error) {
        console.error('Error loading card:', error);
      }
    };

    loadCard();
  }, [selectedEmployee, selectedContract, currentUser.specialty]);

  // Сохранение осмотра
  const handleSaveExamination = async () => {
    if (!ambulatoryCard || !selectedEmployee || !selectedContract || !currentUser.specialty || !currentUser.doctorId) {
      return;
    }

    setIsSaving(true);
    try {
      const contractIdNum = parseInt(selectedContract.id, 10);
      if (isNaN(contractIdNum)) return;

      const specialty = currentUser.specialty;
      const examination: DoctorExamination = {
        doctorId: currentUser.doctorId,
        doctorName: currentUser.companyName || 'Врач',
        specialty,
        date: new Date().toISOString(),
        status: 'completed',
        complaints: examinationForm.complaints,
        objectiveExamination: examinationForm.objectiveExamination,
        diagnosis: examinationForm.diagnosis,
        conclusion: examinationForm.conclusion,
        recommendations: examinationForm.recommendations,
        isFit: examinationForm.isFit,
      };

      const updatedExaminations = {
        ...ambulatoryCard.examinations,
        [specialty]: examination,
      };

      const currentCard = await apiGetAmbulatoryCard(selectedEmployee.id, contractIdNum);
      if (currentCard) {
        await apiUpdateAmbulatoryCard(currentCard.id, {
          examinations: updatedExaminations,
        });
      }

      // Обновляем статус в маршрутном листе
      if (routeSheet) {
        const updatedEmployees = routeSheet.employees.map(emp => {
          if (emp.employeeId === selectedEmployee.id) {
            return {
              ...emp,
              status: 'completed' as const,
              examinationDate: new Date().toISOString(),
            };
          }
          return emp;
        });

        const sheetIdNum = parseInt(routeSheet.id || '0', 10);
        if (!isNaN(sheetIdNum)) {
          await apiUpdateRouteSheet(sheetIdNum, {
            employees: updatedEmployees,
          });

          setRouteSheet({
            ...routeSheet,
            employees: updatedEmployees,
          });
        }
      }

      // Обновляем локальное состояние
      setAmbulatoryCard({
        ...ambulatoryCard,
        examinations: updatedExaminations,
        updatedAt: new Date().toISOString(),
      });

      alert('Осмотр сохранен успешно');
    } catch (error) {
      console.error('Error saving examination:', error);
      alert('Ошибка при сохранении осмотра');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = routeSheet?.employees.filter(emp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return emp.name.toLowerCase().includes(query) || 
           emp.position.toLowerCase().includes(query) ||
           emp.employeeId.includes(query);
  }) || [];

  const handleLogout = () => {
    localStorage.removeItem('medwork_uid');
    localStorage.removeItem('medwork_phone');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderIcon className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Статистика пациентов
  const patientsStats = {
    total: routeSheet?.employees.length || 0,
    completed: routeSheet?.employees.filter(e => e.status === 'completed').length || 0,
    pending: routeSheet?.employees.filter(e => e.status === 'pending').length || 0,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - унифицированный стиль */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Info */}
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <BrandLogo size="sm" />
              </div>
              
              <div className="hidden md:flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    Рабочее место врача
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {currentUser.specialty || 'Врач'}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Stats */}
            {routeSheet && (
              <div className="hidden lg:flex items-center gap-4">
                <div className="px-4 py-2 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500">Всего пациентов</div>
                  <div className="text-sm font-bold text-slate-900">{patientsStats.total}</div>
                </div>
                <div className="px-4 py-2 bg-amber-50 rounded-lg">
                  <div className="text-xs text-amber-600">Ожидают</div>
                  <div className="text-sm font-bold text-amber-700">{patientsStats.pending}</div>
                </div>
                <div className="px-4 py-2 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600">Осмотрено</div>
                  <div className="text-sm font-bold text-green-700">{patientsStats.completed}</div>
                </div>
              </div>
            )}

            {/* Right: Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogoutIcon className="w-4 h-4"/>
              <span className="hidden sm:inline">Выход</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая панель: Договоры и список сотрудников */}
          <div className="lg:col-span-1 space-y-4">
            {/* Выбор договора с детальной информацией */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                  <label className="text-sm font-semibold text-slate-900">
                    Договор
                  </label>
                </div>
                <select
                  value={selectedContract?.id || ''}
                  onChange={(e) => {
                    const contract = contracts.find(c => c.id === e.target.value);
                    setSelectedContract(contract || null);
                    setSelectedEmployee(null);
                    setAmbulatoryCard(null);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
                >
                  {contracts.map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.number} - {contract.clientName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Детальная информация о договоре */}
              {selectedContract && (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Номер</p>
                      <p className="font-semibold text-slate-900">{selectedContract.number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Клиент</p>
                      <p className="font-semibold text-slate-900 truncate">{selectedContract.clientName || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Поиск */}
            {routeSheet && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск сотрудника..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Список сотрудников */}
            {routeSheet ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-900">
                    Пациенты ({filteredEmployees.length})
                  </h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Сотрудники не найдены
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredEmployees.map(emp => {
                        const employee = selectedContract?.employees.find(e => e.id === emp.employeeId);
                        return (
                          <button
                            key={emp.employeeId}
                            onClick={() => setSelectedEmployee(employee || null)}
                            className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                              selectedEmployee?.id === emp.employeeId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">{emp.name}</p>
                                <p className="text-sm text-slate-600 mt-1">{emp.position}</p>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                {emp.status === 'completed' && (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                )}
                                {emp.status === 'pending' && (
                                  <ClockIcon className="w-5 h-5 text-amber-500" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">Маршрутный лист не найден</p>
              </div>
            )}
          </div>

          {/* Правая панель: Форма осмотра */}
          <div className="lg:col-span-2">
            {selectedEmployee && ambulatoryCard ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedEmployee.name}</h2>
                  <p className="text-sm text-slate-600 mt-1">{selectedEmployee.position}</p>
                </div>

                {/* Форма осмотра */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Жалобы
                    </label>
                    <textarea
                      value={examinationForm.complaints}
                      onChange={(e) => setExaminationForm({ ...examinationForm, complaints: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Жалобы пациента..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Объективный осмотр
                    </label>
                    <textarea
                      value={examinationForm.objectiveExamination}
                      onChange={(e) => setExaminationForm({ ...examinationForm, objectiveExamination: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Результаты объективного осмотра..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Диагноз
                    </label>
                    <input
                      type="text"
                      value={examinationForm.diagnosis}
                      onChange={(e) => setExaminationForm({ ...examinationForm, diagnosis: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Диагноз..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Заключение
                    </label>
                    <textarea
                      value={examinationForm.conclusion}
                      onChange={(e) => setExaminationForm({ ...examinationForm, conclusion: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Заключение врача..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Рекомендации
                    </label>
                    <textarea
                      value={examinationForm.recommendations}
                      onChange={(e) => setExaminationForm({ ...examinationForm, recommendations: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Рекомендации..."
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examinationForm.isFit}
                        onChange={(e) => setExaminationForm({ ...examinationForm, isFit: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Годен к работе по специальности
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handleSaveExamination}
                    disabled={isSaving}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <LoaderIcon className="w-5 h-5 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <CheckShieldIcon className="w-5 h-5" />
                        Сохранить осмотр
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <UserMdIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Выберите сотрудника для проведения осмотра</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorWorkspace;

