// Only the stored reason prefix chooses public copy; diagnostics stay private.
export function failureMessageKey(reason?: string | null): 'failureDatabaseBusy' | 'failureAnalysisRefused' | 'failureMeal' {
  if (reason?.startsWith('fdc:')) return 'failureDatabaseBusy';
  if (reason?.startsWith('meta:')) return 'failureAnalysisRefused';
  return 'failureMeal';
}
