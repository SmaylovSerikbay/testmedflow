import React from 'react';
import { UserProfile } from '../types';
import { LoaderIcon, CheckShieldIcon } from './Icons';

// --- STEP ONE ---
interface StepOneProps {
  searchBin: string;
  setSearchBin: (bin: string) => void;
  foundCounterparty: {name: string, bin: string, phone?: string} | null;
  invitePhone: string;
  setInvitePhone: (phone: string) => void;
  isSearching: boolean;
  onNext: () => void;
  currentUser: UserProfile | null;
}

export const StepOne: React.FC<StepOneProps> = ({
  searchBin,
  setSearchBin,
  foundCounterparty,
  invitePhone,
  setInvitePhone,
  isSearching,
  onNext,
  currentUser
}) => (
  <div className="space-y-6">
    <div>
      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
        Найти контрагента ({currentUser?.role === 'organization' ? 'Клинику' : 'Организацию'})
      </label>
      <div className="relative">
        <input 
          value={searchBin}
          onChange={(e) => setSearchBin(e.target.value.replace(/\D/g, '').slice(0, 12))}
          placeholder="Введите БИН (12 цифр)"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono pr-12"
          autoFocus
        />
        {isSearching && searchBin.length === 12 && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <LoaderIcon className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        )}
        {!isSearching && searchBin.length === 12 && foundCounterparty && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <CheckShieldIcon className="w-5 h-5 text-green-600" />
          </div>
        )}
      </div>
      {searchBin.length > 0 && searchBin.length < 12 && (
        <p className="text-xs text-slate-500 mt-1">
          Введите {12 - searchBin.length} {12 - searchBin.length === 1 ? 'цифру' : 'цифр'} для автоматического поиска
        </p>
      )}
    </div>

    {isSearching && searchBin.length === 12 && (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
        <LoaderIcon className="w-5 h-5 animate-spin text-blue-600" />
        <p className="text-sm text-blue-800 font-medium">Поиск организации...</p>
      </div>
    )}

    {foundCounterparty && !isSearching ? (
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
          <CheckShieldIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-green-900">{foundCounterparty.name}</p>
          <div className="flex items-center gap-2 text-xs text-green-700">
            <span>БИН: {foundCounterparty.bin}</span>
            {foundCounterparty.phone && <span>• {foundCounterparty.phone}</span>}
          </div>
        </div>
      </div>
    ) : searchBin.length === 12 && !isSearching && !foundCounterparty ? (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800 font-medium mb-2">Организация не найдена в MedFlow.</p>
        <p className="text-xs text-amber-600 mb-3">
          Мы отправим приглашение на регистрацию и подписание договора в WhatsApp.
        </p>
        <input 
          value={invitePhone}
          onChange={(e) => setInvitePhone(e.target.value)}
          placeholder="+7 (700) 000-00-00"
          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm"
        />
      </div>
    ) : null}

    <div className="pt-4 flex justify-end">
      <button 
        onClick={onNext}
        disabled={(!foundCounterparty && invitePhone.length < 11)}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        Далее: Условия
      </button>
    </div>
  </div>
);

// --- STEP TWO ---
interface StepTwoProps {
  foundCounterparty: {name: string, bin: string, phone?: string} | null;
  searchBin: string;
  contractTerms: {
    price: string;
    headcount: string;
    endDate: string;
    contractDate: string;
  };
  setContractTerms: (terms: any) => void;
  isCreating: boolean;
  onBack: () => void;
  onCreate: () => void;
}

export const StepTwo: React.FC<StepTwoProps> = ({
  foundCounterparty,
  searchBin,
  contractTerms,
  setContractTerms,
  isCreating,
  onBack,
  onCreate
}) => (
  <div className="space-y-4">
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
      <p className="text-xs text-slate-400 uppercase font-bold">Контрагент</p>
      <div>
        <p className="font-bold">{foundCounterparty?.name || `Приглашение для БИН ${searchBin}`}</p>
        {foundCounterparty?.phone && <p className="text-xs text-slate-500 mt-0.5">{foundCounterparty.phone}</p>}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Сумма договора (тенге)</label>
        <input 
          type="number"
          value={contractTerms.price}
          onChange={e => setContractTerms({...contractTerms, price: e.target.value})}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          placeholder="1 500 000"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Планируемое кол-во сотрудников</label>
        <input 
          type="number"
          value={contractTerms.headcount}
          onChange={e => setContractTerms({...contractTerms, headcount: e.target.value})}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          placeholder="50"
        />
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Дата начала</label>
        <input 
          type="date"
          value={contractTerms.contractDate}
          onChange={e => setContractTerms({...contractTerms, contractDate: e.target.value})}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Дата окончания</label>
        <input 
          type="date"
          value={contractTerms.endDate}
          onChange={e => setContractTerms({...contractTerms, endDate: e.target.value})}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
        />
      </div>
    </div>

    <div className="pt-6 flex gap-3">
      <button onClick={onBack} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">
        Назад
      </button>
      <button 
        onClick={onCreate} 
        disabled={isCreating} 
        className="flex-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg flex justify-center items-center"
      >
        {isCreating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : 'Создать и Отправить'}
      </button>
    </div>
  </div>
);