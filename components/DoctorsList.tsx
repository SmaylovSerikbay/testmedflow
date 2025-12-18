import React, { useState, useCallback } from 'react';
import { Doctor, UserProfile } from '../types';
import { apiListDoctors, apiCreateDoctor, apiUpdateDoctor, apiDeleteDoctor, apiCreateUser } from '../services/api';
import { 
  UserMdIcon, PlusIcon, TrashIcon, PenIcon, LoaderIcon, CheckShieldIcon
} from './Icons';
import ConfirmDialog from './ConfirmDialog';

// Полный список специальностей из factorRules + дополнительные роли
// Определяем, является ли специальность врачебной (требует телефон)
const isMedicalSpecialty = (spec: string): boolean => {
  const nonMedicalRoles = ['Регистратор', 'Медсестра', 'Медбрат', 'Лаборант'];
  return !nonMedicalRoles.includes(spec);
};

const SPECIALTIES = [
  // Врачи-специалисты из factorRules
  'Профпатолог',
  'Терапевт',
  'Невропатолог',
  'Невролог',
  'Дерматовенеролог',
  'Аллерголог',
  'Оториноларинголог',
  'Отоларинголог',
  'Офтальмолог',
  'Эндокринолог',
  'Гинеколог',
  'Уролог',
  'Онколог',
  'Рентгенолог',
  'Кардиолог',
  'Психиатр',
  'Психиатр (медицинский психолог)',
  'Нарколог',
  'Гематолог',
  'Хирург',
  'Стоматолог',
  // Дополнительные роли
  'Врач по функциональной диагностике',
  'Врач-лаборант',
  // Вспомогательный персонал
  'Регистратор',
  'Медсестра',
  'Медбрат',
  'Лаборант',
];

interface DoctorsListProps {
  currentUser: UserProfile | null;
  doctors: Doctor[];
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  onDoctorsChange?: () => void;
}

const DoctorsList: React.FC<DoctorsListProps> = ({ 
  currentUser, 
  doctors, 
  showToast,
  onDoctorsChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddDoctor = useCallback(() => {
    setEditingDoctor(null);
    setIsModalOpen(true);
  }, []);

  const handleEditDoctor = useCallback((doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsModalOpen(true);
  }, []);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  const handleDeleteDoctor = useCallback((doctorId: string) => {
    if (!currentUser) return;
    
    const doctor = doctors.find(d => d.id === doctorId);
    setConfirmDialog({
      isOpen: true,
      title: 'Удалить врача?',
      message: doctor ? `Вы уверены, что хотите удалить врача "${doctor.name}" (${doctor.specialty})?` : 'Вы уверены, что хотите удалить этого врача?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiDeleteDoctor(currentUser.uid, Number(doctorId));
          showToast('success', 'Врач успешно удален');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          // Обновляем список врачей
          if (onDoctorsChange) {
            onDoctorsChange();
          }
        } catch (error) {
          console.error('Error deleting doctor:', error);
          showToast('error', 'Ошибка при удалении врача');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }, [currentUser, doctors, showToast]);

  const handleSaveDoctor = useCallback(async (doctorData: { name: string; specialty: string; phone: string; isChairman: boolean }) => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const cleanPhone = doctorData.phone ? doctorData.phone.replace(/\D/g, '') : '';
      
      if (editingDoctor) {
        // Обновление существующего врача
        await apiUpdateDoctor(currentUser.uid, Number(editingDoctor.id), {
          name: doctorData.name,
          specialty: doctorData.specialty,
          phone: cleanPhone || '',
          isChairman: doctorData.isChairman,
        });

        if (cleanPhone && isMedicalSpecialty(doctorData.specialty)) {
          await createOrUpdateDoctorAccount(String(editingDoctor.id), {
            phone: cleanPhone,
            specialty: doctorData.specialty,
            clinicId: currentUser.uid,
            clinicBin: currentUser.bin,
          });
        }
        
        showToast('success', 'Врач успешно обновлен');
      } else {
        // Добавление нового врача
        const created = await apiCreateDoctor(currentUser.uid, {
          name: doctorData.name,
          specialty: doctorData.specialty,
          phone: cleanPhone || '',
          isChairman: doctorData.isChairman,
        });

        if (cleanPhone && isMedicalSpecialty(doctorData.specialty)) {
          await createOrUpdateDoctorAccount(String(created.id), {
            phone: cleanPhone,
            specialty: doctorData.specialty,
            clinicId: currentUser.uid,
            clinicBin: currentUser.bin,
          });
        }
        
        showToast('success', 'Врач успешно добавлен');
      }
      setIsModalOpen(false);
      setEditingDoctor(null);
      // Обновляем список врачей
      if (onDoctorsChange) {
        onDoctorsChange();
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      showToast('error', 'Ошибка при сохранении врача');
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, editingDoctor, showToast]);

  // Функция создания аккаунта врача в системе (через новый API пользователей)
  const createOrUpdateDoctorAccount = async (doctorId: string, doctorData: any) => {
    try {
      const userId = 'doctor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await apiCreateUser({
        uid: userId,
        role: 'doctor',
        phone: doctorData.phone,
        doctorId,
        clinicId: doctorData.clinicId,
        clinicBin: doctorData.clinicBin,
        specialty: doctorData.specialty,
        createdAt: new Date().toISOString(),
      } as any);
    } catch (error) {
      console.error('Error creating doctor account:', error);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative overflow-auto bg-slate-50">
      <div className="p-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Врачи</h2>
            <p className="text-sm text-slate-500 mt-1">
              {doctors.length === 0 
                ? 'Нет врачей в клинике' 
                : `${doctors.length} ${doctors.length === 1 ? 'врач' : doctors.length < 5 ? 'врача' : 'врачей'}`}
            </p>
          </div>
          <button 
            onClick={handleAddDoctor}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <PlusIcon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Добавить врача</span>
          </button>
        </div>

        {doctors.length === 0 ? (
          <EmptyState onAddDoctor={handleAddDoctor} />
        ) : (
          <DoctorsTable 
            doctors={doctors}
            onEdit={handleEditDoctor}
            onDelete={handleDeleteDoctor}
          />
        )}
      </div>

      {isModalOpen && (
        <DoctorModal
          doctor={editingDoctor}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDoctor(null);
          }}
          onSave={handleSaveDoctor}
          isSaving={isSaving}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
};

// --- EMPTY STATE ---
interface EmptyStateProps {
  onAddDoctor: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddDoctor }) => (
  <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-300">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <UserMdIcon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Нет врачей</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
      Добавьте врачей в вашу клинику для работы с договорами и проведения медицинских осмотров.
    </p>
    <button 
      onClick={onAddDoctor}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
    >
      <PlusIcon className="w-4 h-4" />
      Добавить врача
    </button>
  </div>
);

// --- DOCTORS TABLE ---
interface DoctorsTableProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
}

const DoctorsTable: React.FC<DoctorsTableProps> = ({ doctors, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                ФИО
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Специальность
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Телефон
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserMdIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-900">{doctor.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-slate-700">{doctor.specialty}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {doctor.phone ? (
                    <span className="text-slate-700 font-mono text-sm">
                      {(() => {
                        // Форматируем телефон для отображения
                        const numbers = doctor.phone.replace(/\D/g, '');
                        if (numbers.length === 11 && numbers.startsWith('7')) {
                          return `+7 (${numbers.substring(1, 4)}) ${numbers.substring(4, 7)}-${numbers.substring(7, 9)}-${numbers.substring(9, 11)}`;
                        }
                        return doctor.phone;
                      })()}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Не указан</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {doctor.isChairman ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      Председатель
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm">Врач</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(doctor)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <PenIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(doctor.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- DOCTOR MODAL ---
interface DoctorModalProps {
  doctor: Doctor | null;
  onClose: () => void;
  onSave: (data: { name: string; specialty: string; phone: string; isChairman: boolean }) => void;
  isSaving: boolean;
}

const DoctorModal: React.FC<DoctorModalProps> = ({ doctor, onClose, onSave, isSaving }) => {
  const [name, setName] = useState(doctor?.name || '');
  const [specialty, setSpecialty] = useState(doctor?.specialty || '');
  const [phone, setPhone] = useState(() => {
    // Форматируем телефон при инициализации, если он есть
    if (doctor?.phone) {
      const numbers = doctor.phone.replace(/\D/g, '');
      if (numbers.length === 11 && numbers.startsWith('7')) {
        let formatted = '+7';
        if (numbers.length > 1) formatted += ' (' + numbers.substring(1, 4);
        if (numbers.length > 4) formatted += ') ' + numbers.substring(4, 7);
        if (numbers.length > 7) formatted += '-' + numbers.substring(7, 9);
        if (numbers.length > 9) formatted += '-' + numbers.substring(9, 11);
        return formatted;
      }
      return doctor.phone;
    }
    return '';
  });
  const [isChairman, setIsChairman] = useState(doctor?.isChairman || false);
  
  // Обновляем состояние при изменении doctor
  React.useEffect(() => {
    if (doctor) {
      setName(doctor.name || '');
      setSpecialty(doctor.specialty || '');
      setIsChairman(doctor.isChairman || false);
      if (doctor.phone) {
        const numbers = doctor.phone.replace(/\D/g, '');
        if (numbers.length === 11 && numbers.startsWith('7')) {
          let formatted = '+7';
          if (numbers.length > 1) formatted += ' (' + numbers.substring(1, 4);
          if (numbers.length > 4) formatted += ') ' + numbers.substring(4, 7);
          if (numbers.length > 7) formatted += '-' + numbers.substring(7, 9);
          if (numbers.length > 9) formatted += '-' + numbers.substring(9, 11);
          setPhone(formatted);
        } else {
          setPhone(doctor.phone);
        }
      } else {
        setPhone('');
      }
    } else {
      setName('');
      setSpecialty('');
      setPhone('');
      setIsChairman(false);
    }
  }, [doctor]);

  // Форматирование телефона
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers[0] === '7' || numbers[0] === '8') {
      let formatted = '+7';
      if (numbers.length > 1) formatted += ' (' + numbers.substring(1, 4);
      if (numbers.length > 4) formatted += ') ' + numbers.substring(4, 7);
      if (numbers.length > 7) formatted += '-' + numbers.substring(7, 9);
      if (numbers.length > 9) formatted += '-' + numbers.substring(9, 11);
      return formatted;
    } else {
      return '+7 (' + numbers.substring(0, 3);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length < phone.length) {
      setPhone(val);
      return;
    }
    setPhone(formatPhone(val));
  };


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specialty.trim()) {
      return;
    }
    // Телефон обязателен только для врачей
    if (isMedicalSpecialty(specialty) && !phone.trim()) {
      return;
    }
    onSave({ name: name.trim(), specialty, phone: phone.trim(), isChairman });
  }, [name, specialty, phone, isChairman, onSave]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">
            {doctor ? 'Редактировать врача' : 'Добавить врача'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ФИО врача
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Иванов Иван Иванович"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Специальность
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSaving}
            >
              <option value="">Выберите специальность</option>
              {SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Номер телефона 
              {isMedicalSpecialty(specialty) && (
                <span className="text-red-500">*</span>
              )}
              <span className="text-slate-400 text-xs"> (для создания аккаунта)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+7 (XXX) XXX-XX-XX"
              disabled={isSaving}
              required={isMedicalSpecialty(specialty)}
            />
            <p className="text-xs text-slate-400 mt-1">
              {isMedicalSpecialty(specialty) 
                ? 'Телефон обязателен для создания аккаунта врача в системе'
                : 'Телефон необязателен для вспомогательного персонала'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isChairman"
              checked={isChairman}
              onChange={(e) => setIsChairman(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              disabled={isSaving}
            />
            <label htmlFor="isChairman" className="text-sm font-medium text-slate-700">
              Председатель комиссии
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={
                isSaving || 
                !name.trim() || 
                !specialty.trim() || 
                (isMedicalSpecialty(specialty) && !phone.replace(/\D/g, '').trim())
              }
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <CheckShieldIcon className="w-4 h-4" />
                  {doctor ? 'Сохранить' : 'Добавить'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorsList;
