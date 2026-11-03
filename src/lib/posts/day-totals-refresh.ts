// A batch of refreshed cards often changes the same local day. Read that day
// once per burst, then re-read once if another change arrives during the read.
// Each day retains its own revision so an older response cannot publish totals
// after a correction, deletion or moved meal has invalidated that day.
export function createDayTotalsRefresh<T extends {day: string}>({read, commit}: {
  read: (dates: string[]) => Promise<T[]>;
  commit: (days: T[]) => void;
}) {
  const queued = new Set<string>();
  const revisions = new Map<string, number>();
  let revision = 0;
  let running = false;
  let live = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (live && !running && timer === undefined && queued.size) {
      timer = setTimeout(() => { timer = undefined; void flush(); }, 0);
    }
  };
  const flush = async () => {
    if (!live || running || !queued.size) return;
    const dates = [...queued].sort();
    const versions = new Map(dates.map(day => [day, revisions.get(day)]));
    queued.clear();
    running = true;
    try {
      const days = await read(dates);
      if (!live) return;
      const fresh = days.filter(day => versions.has(day.day) && revisions.get(day.day) === versions.get(day.day));
      if (fresh.length) commit(fresh);
    } catch { /* Keep the last complete totals; a later event can retry. */ }
    finally { running = false; schedule(); }
  };
  return {
    request(dates: string[]) {
      if (!live || !dates.length) return;
      const current = ++revision;
      for (const day of dates) { queued.add(day); revisions.set(day, current); }
      schedule();
    },
    cancel() {
      live = false;
      clearTimeout(timer);
      timer = undefined;
      queued.clear();
    },
  };
}
