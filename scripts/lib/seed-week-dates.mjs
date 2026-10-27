// Explicit IANA zone must match the browser used for the search demonstration.
export function seedWeekDates(zone, now=new Date()) {
 if(!zone)throw new Error('Set TEST_TIME_ZONE to the browser IANA timezone before seeding.');
 const format=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const parts=date=>Object.fromEntries(format.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
 const today=parts(now);
 return Array.from({length:7},(_,day)=>{
  const local=new Date(Date.UTC(today.year,today.month-1,today.day-day,day===1?8:12));
  const target=local.getTime();let instant=target;
  // Correct the UTC guess by the observed local wall-clock difference.
  for(let attempt=0;attempt<4;attempt++){
   const p=parts(new Date(instant));const observed=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
   if(observed===target)break;instant+=target-observed;
  }
  const p=parts(new Date(instant));
  if(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)!==target)throw new Error('Seed local time does not exist in this timezone.');
  return {eatenAt:new Date(instant).toISOString(),saturday:local.getUTCDay()===6,bigBreakfast:day===1};
 });
}
