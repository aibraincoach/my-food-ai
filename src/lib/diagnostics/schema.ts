export const SCREENS = ['feed','post','days','search','profile','about','deleted','agents','admin','welcome','sign-in','sign-up','handle','reset','other'] as const;
export const CAMERA_ERRORS = ['NotAllowedError','NotFoundError','NotReadableError','OverconstrainedError','AbortError','SecurityError','InvalidStateError','NotSupportedError'] as const;
export const VALUES: Record<string, readonly string[]> = {
  'page-load': [], screen: SCREENS, visibility: ['visible','hidden'], update: ['found','waiting','deferred','reloading'],
  camera: ['opening','ready','closed',...CAMERA_ERRORS.map(name=>`failed:${name}`),'failed:other'], sheet: ['capture-open','capture-close'],
};
export type DiagnosticEvent = {t:number;name:string;value?:string};
export type FreezeReport = {events:DiagnosticEvent[];user_agent:string;build:string;camera_permission:'granted'|'denied'|'prompt'|'unknown'};
const exact = (value: object, keys: string[]) => Object.keys(value).length===keys.length && Object.keys(value).every(key=>keys.includes(key));
export function validEvent(value: unknown): value is DiagnosticEvent {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const e=value as DiagnosticEvent;
  if(!Number.isSafeInteger(e.t)||e.t<0||e.t>8_640_000_000_000_000||typeof e.name!=='string'||!Object.hasOwn(VALUES,e.name))return false;
  return e.name==='page-load'?exact(e,['t','name']):exact(e,['t','name','value'])&&VALUES[e.name].includes(e.value as string);
}
export function validReport(value: unknown): value is FreezeReport {
  if(!value||typeof value!=='object'||Array.isArray(value)||!exact(value,['events','user_agent','build','camera_permission']))return false;
  const r=value as FreezeReport;
  return Array.isArray(r.events)&&r.events.length<=20&&r.events.every(validEvent)&&typeof r.user_agent==='string'&&r.user_agent.length<=300&&typeof r.build==='string'&&r.build.length<=80&&['granted','denied','prompt','unknown'].includes(r.camera_permission);
}
export function screenForPath(path:string):typeof SCREENS[number] {
  if(path==='/'||path==='/today')return 'feed';
  if(/^\/posts\/[^/]+\/?$/.test(path))return 'post';
  if(path.startsWith('/days/'))return 'days';
  if(path==='/profile/about')return 'about';
  if(path==='/profile/deleted')return 'deleted';
  if(path==='/profile/agents'||path.startsWith('/profile/agents/')||path==='/agents'||path.startsWith('/agents/'))return 'agents';
  if(path==='/admin'||path.startsWith('/admin/'))return 'admin';
  const routes:Record<string,typeof SCREENS[number]>={'/days':'days','/search':'search','/profile':'profile','/welcome':'welcome','/sign-in':'sign-in','/sign-up':'sign-up','/choose-handle':'handle','/reset-password':'reset','/forgot-password':'reset'};
  return routes[path]??'other';
}
export function cameraFailure(cause:unknown):string {
  const name=cause&&typeof cause==='object'&&'name' in cause?cause.name:undefined;
  return `failed:${CAMERA_ERRORS.includes(name as typeof CAMERA_ERRORS[number])?name:'other'}`;
}
