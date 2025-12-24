import { DoctorVisit } from '../types/medical-forms';

// Маппинг строковых специальностей в enum
export function mapSpecialtyToEnum(specialty: string): DoctorVisit['specialty'] {
  const normalized = specialty.toLowerCase().trim();
  
  if (normalized.includes('терапевт')) return 'THERAPIST';
  if (normalized.includes('хирург')) return 'SURGEON';
  if (normalized.includes('невропатолог') || normalized.includes('невролог')) return 'NEUROLOGIST';
  if (normalized.includes('оториноларинголог') || normalized.includes('лор')) return 'ENT';
  if (normalized.includes('офтальмолог')) return 'OPHTHALMOLOGIST';
  if (normalized.includes('дерматовенеролог') || normalized.includes('дерматолог')) return 'DERMATOLOGIST';
  if (normalized.includes('гинеколог')) return 'GYNECOLOGIST';
  if (normalized.includes('психиатр')) return 'PSYCHIATRIST';
  if (normalized.includes('нарколог')) return 'NARCOLOGIST';
  
  // По умолчанию терапевт
  return 'THERAPIST';
}

