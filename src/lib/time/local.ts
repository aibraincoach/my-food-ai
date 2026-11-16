export function formatLocalTime(value: string, zone?: string, weekday = false): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const options = { hour: 'numeric', minute: '2-digit', ...(zone ? {timeZone: zone} : {}) } as const;
  const clock = date.toLocaleTimeString('en-US', options);
  return weekday ? `${date.toLocaleDateString('en-US',{weekday:'long',...(zone?{timeZone:zone}:{})})} · ${clock}` : clock;
}

export function formatLocalDate(value:string,zone?:string):string {
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',...(zone?{timeZone:zone}:{})}):'';
}
