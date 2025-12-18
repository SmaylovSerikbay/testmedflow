import React, { useState } from 'react';
import { AudiologyExaminationCard } from '../../types/form052';
import CollapsibleSection from './CollapsibleSection';

interface Form052AudiologyExaminationProps {
  data?: AudiologyExaminationCard;
  onChange: (data: AudiologyExaminationCard) => void;
  editMode: boolean;
}

const Form052AudiologyExamination: React.FC<Form052AudiologyExaminationProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState<AudiologyExaminationCard>(data);

  const handleChange = (field: keyof AudiologyExaminationCard, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    const sectionData = (formData as any)[section] || {};
    handleChange(section as keyof AudiologyExaminationCard, { ...sectionData, [field]: value });
  };

  const renderDiagnosisSection = (title: string, diagnosisKey: string, degrees: string[]) => {
    const diagnosis = (formData.diagnosis as any)?.[diagnosisKey];
    
    return (
      <div className="border border-slate-300 rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-slate-800">{title}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Одностороннее</label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diagnosis?.unilateral || false}
                  onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, { ...diagnosis, unilateral: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{diagnosis?.unilateral ? 'Да' : '—'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Двустороннее</label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diagnosis?.bilateral || false}
                  onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, { ...diagnosis, bilateral: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{diagnosis?.bilateral ? 'Да' : '—'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Правое ухо (АД)</label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diagnosis?.rightEar || false}
                  onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, { ...diagnosis, rightEar: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{diagnosis?.rightEar ? 'Да' : '—'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Левое ухо (АС)</label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diagnosis?.leftEar || false}
                  onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, { ...diagnosis, leftEar: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{diagnosis?.leftEar ? 'Да' : '—'}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHearingLossSection = (title: string, diagnosisKey: string) => {
    const hearingLoss = (formData.diagnosis as any)?.[diagnosisKey];
    
    return (
      <div className="border border-slate-300 rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-slate-800">{title}</h4>
        
        {['degree1', 'degree2', 'degree3', 'degree4', 'deafness'].map((degree) => {
          const degreeData = hearingLoss?.[degree];
          return (
            <div key={degree} className="border-t border-slate-200 pt-4">
              <h5 className="font-medium text-slate-700 mb-2">
                {degree === 'degree1' ? 'I степень' :
                 degree === 'degree2' ? 'II степень' :
                 degree === 'degree3' ? 'III степень' :
                 degree === 'degree4' ? 'IV степень' :
                 'Глухота'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Одностороннее</label>
                  {editMode ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={degreeData?.unilateral || false}
                        onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, {
                          ...hearingLoss,
                          [degree]: { ...degreeData, unilateral: e.target.checked }
                        })}
                        className="w-4 h-4"
                      />
                      <span>Да</span>
                    </label>
                  ) : (
                    <p className="px-3 py-2 bg-slate-50 rounded-lg">{degreeData?.unilateral ? 'Да' : '—'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Двустороннее</label>
                  {editMode ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={degreeData?.bilateral || false}
                        onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, {
                          ...hearingLoss,
                          [degree]: { ...degreeData, bilateral: e.target.checked }
                        })}
                        className="w-4 h-4"
                      />
                      <span>Да</span>
                    </label>
                  ) : (
                    <p className="px-3 py-2 bg-slate-50 rounded-lg">{degreeData?.bilateral ? 'Да' : '—'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Правое ухо (АД)</label>
                  {editMode ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={degreeData?.rightEar || false}
                        onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, {
                          ...hearingLoss,
                          [degree]: { ...degreeData, rightEar: e.target.checked }
                        })}
                        className="w-4 h-4"
                      />
                      <span>Да</span>
                    </label>
                  ) : (
                    <p className="px-3 py-2 bg-slate-50 rounded-lg">{degreeData?.rightEar ? 'Да' : '—'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Левое ухо (АС)</label>
                  {editMode ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={degreeData?.leftEar || false}
                        onChange={(e) => handleNestedChange('diagnosis', diagnosisKey, {
                          ...hearingLoss,
                          [degree]: { ...degreeData, leftEar: e.target.checked }
                        })}
                        className="w-4 h-4"
                      />
                      <span>Да</span>
                    </label>
                  ) : (
                    <p className="px-3 py-2 bg-slate-50 rounded-lg">{degreeData?.leftEar ? 'Да' : '—'}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Основные данные */}
      <CollapsibleSection title="Основные данные" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ФИО пациента
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.patientFullName || ''}
                onChange={(e) => handleChange('patientFullName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.patientFullName || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Возраст
            </label>
            {editMode ? (
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.age || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ИИН
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.iin || ''}
                onChange={(e) => handleChange('iin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.iin || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Адрес
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.address || '—'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Направленные в рамках аудиологического скрининга
            </label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.referredForScreening || false}
                  onChange={(e) => handleChange('referredForScreening', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.referredForScreening ? 'Да' : '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Направленные по заболеванию
            </label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.referredForDisease || false}
                  onChange={(e) => handleChange('referredForDisease', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.referredForDisease ? 'Да' : '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Впервые выявленное заболевание
            </label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.newlyDiagnosed || false}
                  onChange={(e) => handleChange('newlyDiagnosed', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.newlyDiagnosed ? 'Да' : '—'}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Известное раннее заболевание
          </label>
          {editMode ? (
            <textarea
              value={formData.knownPriorDisease || ''}
              onChange={(e) => handleChange('knownPriorDisease', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.knownPriorDisease || '—'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Жалобы
          </label>
          {editMode ? (
            <textarea
              value={formData.complaints || ''}
              onChange={(e) => handleChange('complaints', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.complaints || '—'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Анамнез заболевания
          </label>
          {editMode ? (
            <textarea
              value={formData.diseaseAnamnesis || ''}
              onChange={(e) => handleChange('diseaseAnamnesis', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.diseaseAnamnesis || '—'}</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Диагноз */}
      <CollapsibleSection title="Диагноз" defaultExpanded={false}>
        <div className="space-y-4">
          {renderDiagnosisSection('Врожденная патология наружного уха', 'congenitalExternalEar', [])}
          {renderDiagnosisSection('Врожденная патология внутреннего уха', 'congenitalInnerEar', [])}
          {renderDiagnosisSection('Аудиторная нейропатия', 'auditoryNeuropathy', [])}
          {renderHearingLossSection('Сенсоневральная тугоухость', 'sensorineuralHearingLoss')}
          {renderHearingLossSection('Кондуктивная тугоухость', 'conductiveHearingLoss')}
          {renderHearingLossSection('Смешанная тугоухость', 'mixedHearingLoss')}
        </div>
      </CollapsibleSection>

      {/* Слуховые аппараты */}
      <CollapsibleSection title="Слуховые аппараты" defaultExpanded={false}>
        <div className="border border-slate-300 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Использует слуховые аппараты
            </label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hearingAids?.has || false}
                  onChange={(e) => handleNestedChange('hearingAids', 'has', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.hearingAids?.has ? 'Да' : '—'}</p>
            )}
          </div>

          {formData.hearingAids?.has && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Воздушная проводимость
                </label>
                {editMode ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hearingAids?.airConduction?.rightEar || false}
                        onChange={(e) => handleNestedChange('hearingAids', 'airConduction', {
                          ...formData.hearingAids?.airConduction,
                          rightEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Правое ухо (АД)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hearingAids?.airConduction?.leftEar || false}
                        onChange={(e) => handleNestedChange('hearingAids', 'airConduction', {
                          ...formData.hearingAids?.airConduction,
                          leftEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Левое ухо (АС)</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.hearingAids?.airConduction?.rightEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Правое ухо (АД)</p>
                    )}
                    {formData.hearingAids?.airConduction?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Левое ухо (АС)</p>
                    )}
                    {!formData.hearingAids?.airConduction?.rightEar && !formData.hearingAids?.airConduction?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Костная проводимость
                </label>
                {editMode ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hearingAids?.boneConduction?.rightEar || false}
                        onChange={(e) => handleNestedChange('hearingAids', 'boneConduction', {
                          ...formData.hearingAids?.boneConduction,
                          rightEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Правое ухо (АД)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hearingAids?.boneConduction?.leftEar || false}
                        onChange={(e) => handleNestedChange('hearingAids', 'boneConduction', {
                          ...formData.hearingAids?.boneConduction,
                          leftEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Левое ухо (АС)</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.hearingAids?.boneConduction?.rightEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Правое ухо (АД)</p>
                    )}
                    {formData.hearingAids?.boneConduction?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Левое ухо (АС)</p>
                    )}
                    {!formData.hearingAids?.boneConduction?.rightEar && !formData.hearingAids?.boneConduction?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Имплантируемые системы */}
      <CollapsibleSection title="Имплантируемые системы" defaultExpanded={false}>
        <div className="border border-slate-300 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Использует имплантируемые системы
            </label>
            {editMode ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.implantableSystems?.has || false}
                  onChange={(e) => handleNestedChange('implantableSystems', 'has', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Да</span>
              </label>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.implantableSystems?.has ? 'Да' : '—'}</p>
            )}
          </div>

          {formData.implantableSystems?.has && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Среднее ухо
                </label>
                {editMode ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.implantableSystems?.middleEar?.rightEar || false}
                        onChange={(e) => handleNestedChange('implantableSystems', 'middleEar', {
                          ...formData.implantableSystems?.middleEar,
                          rightEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Правое ухо (АД)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.implantableSystems?.middleEar?.leftEar || false}
                        onChange={(e) => handleNestedChange('implantableSystems', 'middleEar', {
                          ...formData.implantableSystems?.middleEar,
                          leftEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Левое ухо (АС)</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.implantableSystems?.middleEar?.rightEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Правое ухо (АД)</p>
                    )}
                    {formData.implantableSystems?.middleEar?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Левое ухо (АС)</p>
                    )}
                    {!formData.implantableSystems?.middleEar?.rightEar && !formData.implantableSystems?.middleEar?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Костная проводимость
                </label>
                {editMode ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.implantableSystems?.boneConduction?.rightEar || false}
                        onChange={(e) => handleNestedChange('implantableSystems', 'boneConduction', {
                          ...formData.implantableSystems?.boneConduction,
                          rightEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Правое ухо (АД)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.implantableSystems?.boneConduction?.leftEar || false}
                        onChange={(e) => handleNestedChange('implantableSystems', 'boneConduction', {
                          ...formData.implantableSystems?.boneConduction,
                          leftEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Левое ухо (АС)</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.implantableSystems?.boneConduction?.rightEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Правое ухо (АД)</p>
                    )}
                    {formData.implantableSystems?.boneConduction?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Левое ухо (АС)</p>
                    )}
                    {!formData.implantableSystems?.boneConduction?.rightEar && !formData.implantableSystems?.boneConduction?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Кохлеарная имплантация
                </label>
                {editMode ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.implantableSystems?.cochlearImplantation?.rightEar || false}
                        onChange={(e) => handleNestedChange('implantableSystems', 'cochlearImplantation', {
                          ...formData.implantableSystems?.cochlearImplantation,
                          rightEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Правое ухо (АД)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.implantableSystems?.cochlearImplantation?.leftEar || false}
                        onChange={(e) => handleNestedChange('implantableSystems', 'cochlearImplantation', {
                          ...formData.implantableSystems?.cochlearImplantation,
                          leftEar: e.target.checked
                        })}
                        className="w-4 h-4"
                      />
                      <span>Левое ухо (АС)</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.implantableSystems?.cochlearImplantation?.rightEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Правое ухо (АД)</p>
                    )}
                    {formData.implantableSystems?.cochlearImplantation?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">Левое ухо (АС)</p>
                    )}
                    {!formData.implantableSystems?.cochlearImplantation?.rightEar && !formData.implantableSystems?.cochlearImplantation?.leftEar && (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Образовательное учреждение и место работы */}
      <CollapsibleSection title="Образовательное учреждение и место работы" defaultExpanded={false}>
        <div className="border border-slate-300 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Дошкольное учреждение
            </label>
            {editMode ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.educationalInstitution?.preschool?.general || false}
                    onChange={(e) => handleNestedChange('educationalInstitution', 'preschool', {
                      ...formData.educationalInstitution?.preschool,
                      general: e.target.checked
                    })}
                    className="w-4 h-4"
                  />
                  <span>Общее</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.educationalInstitution?.preschool?.special || false}
                    onChange={(e) => handleNestedChange('educationalInstitution', 'preschool', {
                      ...formData.educationalInstitution?.preschool,
                      special: e.target.checked
                    })}
                    className="w-4 h-4"
                  />
                  <span>Специальное</span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.educationalInstitution?.preschool?.general && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">Общее</p>
                )}
                {formData.educationalInstitution?.preschool?.special && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">Специальное</p>
                )}
                {!formData.educationalInstitution?.preschool?.general && !formData.educationalInstitution?.preschool?.special && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Школа
            </label>
            {editMode ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.educationalInstitution?.school?.general || false}
                    onChange={(e) => handleNestedChange('educationalInstitution', 'school', {
                      ...formData.educationalInstitution?.school,
                      general: e.target.checked
                    })}
                    className="w-4 h-4"
                  />
                  <span>Общая</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.educationalInstitution?.school?.special || false}
                    onChange={(e) => handleNestedChange('educationalInstitution', 'school', {
                      ...formData.educationalInstitution?.school,
                      special: e.target.checked
                    })}
                    className="w-4 h-4"
                  />
                  <span>Специальная</span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.educationalInstitution?.school?.general && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">Общая</p>
                )}
                {formData.educationalInstitution?.school?.special && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">Специальная</p>
                )}
                {!formData.educationalInstitution?.school?.general && !formData.educationalInstitution?.school?.special && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Высшее образование
              </label>
              {editMode ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.educationalInstitution?.higher || false}
                    onChange={(e) => handleNestedChange('educationalInstitution', 'higher', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Да</span>
                </label>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.educationalInstitution?.higher ? 'Да' : '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Среднее образование
              </label>
              {editMode ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.educationalInstitution?.secondary || false}
                    onChange={(e) => handleNestedChange('educationalInstitution', 'secondary', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Да</span>
                </label>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.educationalInstitution?.secondary ? 'Да' : '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Место работы
              </label>
              {editMode ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.workplace || false}
                    onChange={(e) => handleChange('workplace', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Да</span>
                </label>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.workplace ? 'Да' : '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Неорганизованные
              </label>
              {editMode ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.unorganized || false}
                    onChange={(e) => handleChange('unorganized', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Да</span>
                </label>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.unorganized ? 'Да' : '—'}</p>
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052AudiologyExamination;
