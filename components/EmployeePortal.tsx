import React, { useState, useEffect } from 'react';
import { UserProfile, Contract, Employee, EmployeeRoute, DoctorRouteSheet, AmbulatoryCard } from '../types';
import { 
  LoaderIcon, 
  LogoutIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  FileTextIcon,
  UserMdIcon,
  AlertCircleIcon
} from './Icons';
import AmbulatoryCardView from './AmbulatoryCardView';
import {
  apiGetContract,
  apiListRouteSheets,
  apiGetAmbulatoryCard,
  apiListDoctors,
} from '../services/api';

interface EmployeePortalProps {
  currentUser: UserProfile;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ currentUser }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [ambulatoryCard, setAmbulatoryCard] = useState<AmbulatoryCard | null>(null);
  const [employeeRoute, setEmployeeRoute] = useState<EmployeeRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser.employeeId) {
        setIsLoading(false);
        return;
      }

      try {
        // Если есть contractId - загружаем договор
        if (currentUser.contractId) {
          const contractIdNum = parseInt(currentUser.contractId, 10);
          if (!isNaN(contractIdNum)) {
            // Загружаем договор
            const apiContract = await apiGetContract(contractIdNum);
            if (apiContract) {
              const contractData: Contract = {
                id: String(apiContract.id),
                number: apiContract.number,
                clientName: apiContract.clientName,
                clientBin: apiContract.clientBin,
                clientSigned: apiContract.clientSigned,
                clinicName: apiContract.clinicName,
                clinicBin: apiContract.clinicBin,
                clinicSigned: apiContract.clinicSigned,
                date: apiContract.date,
                status: apiContract.status as any,
                price: apiContract.price,
                plannedHeadcount: apiContract.plannedHeadcount,
                employees: apiContract.employees || [],
                documents: apiContract.documents || [],
                calendarPlan: apiContract.calendarPlan,
              };
              setContract(contractData);

              // Находим сотрудника
              const emp = contractData.employees?.find(e => e.id === currentUser.employeeId);
              if (emp) {
                setEmployee(emp);
              }

              // Загружаем маршрутные листы
              const apiSheets = await apiListRouteSheets({ contractId: contractIdNum });
              
              // Формируем маршрут сотрудника
              const routeItems: EmployeeRoute['routeItems'] = [];
              apiSheets.forEach(sheet => {
                const empInSheet = sheet.employees.find(e => e.employeeId === currentUser.employeeId);
                if (empInSheet) {
                  routeItems.push({
                    specialty: sheet.specialty || 'Не указано',
                    doctorId: sheet.virtualDoctor ? undefined : sheet.doctorId,
                    status: empInSheet.status === 'completed' ? 'completed' : 'pending',
                    examinationDate: empInSheet.examinationDate,
                    order: routeItems.length + 1,
                  });
                }
              });

              if (routeItems.length > 0) {
                setEmployeeRoute({
                  employeeId: currentUser.employeeId,
                  contractId: currentUser.contractId,
                  routeItems: routeItems.sort((a, b) => a.order - b.order),
                });
              }
            }
          }
        } else {
          // Для индивидуальных пациентов создаем базовый маршрут
          setEmployeeRoute({
            employeeId: currentUser.employeeId,
            contractId: undefined,
            routeItems: [
              {
                specialty: 'Профпатолог',
                status: 'pending',
                order: 1,
              },
              {
                specialty: 'Терапевт',
                status: 'pending',
                order: 2,
              },
            ],
          });

          // Создаем базовую информацию о сотруднике для индивидуального пациента
          setEmployee({
            id: currentUser.employeeId,
            name: currentUser.leaderName || 'Индивидуальный пациент',
            dob: '',
            gender: 'М',
            site: '',
            position: '',
            harmfulFactor: '',
            status: 'pending',
          });
        }

        // Загружаем амбулаторную карту (может быть null contractId для индивидуальных)
        const contractIdNum = currentUser.contractId ? parseInt(currentUser.contractId, 10) : null;
        const apiCard = await apiGetAmbulatoryCard(
          currentUser.employeeId, 
          !isNaN(contractIdNum as number) ? contractIdNum : null
        );
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
        }
      } catch (error) {
        console.error('Error loading employee data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

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

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircleIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Данные не найдены</h2>
          <p className="text-slate-600 mb-4">
            Не удалось загрузить информацию о пациенте.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Моя амбулаторная карта</h1>
              <p className="text-sm text-slate-600 mt-1">
                {employee.name} • {employee.position}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogoutIcon className="w-4 h-4" />
              Выход
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Маршрут осмотра */}
        {employeeRoute && employeeRoute.routeItems.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Маршрут осмотра
            </h2>
            <div className="space-y-3">
              {employeeRoute.routeItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                    item.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center font-bold text-slate-600">
                    {item.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{item.specialty}</p>
                    {item.doctorName && (
                      <p className="text-sm text-slate-600 mt-1">Врач: {item.doctorName}</p>
                    )}
                    {item.examinationDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        Осмотр: {new Date(item.examinationDate).toLocaleString('ru-RU')}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {item.status === 'completed' ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    ) : (
                      <ClockIcon className="w-6 h-6 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Амбулаторная карта */}
        {ambulatoryCard ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <AmbulatoryCardView 
              card={ambulatoryCard} 
              contract={contract} 
              doctors={[]} 
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <FileTextIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Амбулаторная карта будет создана при первом осмотре</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePortal;

