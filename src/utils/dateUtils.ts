const DATE_FMT = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const WEEKDAY_FMT = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
const MONTH_FMT = new Intl.DateTimeFormat('es-ES', { month: 'short' });

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

/** Convierte "YYYY-MM-DD" a un Date a medianoche en hora local. */
export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, amount: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + amount);
  return toDateStr(d);
}

/** Lunes de la semana que contiene `dateStr`. */
export function startOfWeek(dateStr: string): string {
  const d = parseDateStr(dateStr);
  const day = (d.getDay() + 6) % 7; // lunes = 0
  return addDays(dateStr, -day);
}

/** Últimos `count` días terminando en `end`. */
export function lastDays(end: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

export function isPast(dateStr: string, ref?: string): boolean {
  return dateStr < (ref ?? todayStr());
}

export function isSameDay(dateStr: string, ref: string): boolean {
  return dateStr === ref;
}

export function formatShort(dateStr: string): string {
  return DATE_FMT.format(parseDateStr(dateStr)).replace('.', '');
}

export function weekdayLabel(dateStr: string): string {
  return WEEKDAY_FMT.format(parseDateStr(dateStr)).replace('.', '');
}

export function monthLabel(dateStr: string): string {
  return MONTH_FMT.format(parseDateStr(dateStr)).replace('.', '');
}

export function dayNumber(dateStr: string): number {
  return parseDateStr(dateStr).getDate();
}

export function isWeekend(dateStr: string): boolean {
  const d = parseDateStr(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

/** "YYYY-MM-DDTHH:mm" → ISO completo, para notificaciones locales. */
export function localDateTimeToISO(value: string): string {
  const [date, time] = value.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

/** ISO completo → "YYYY-MM-DDTHH:mm" para <input type="datetime-local">. */
export function isoToLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${toDateStr(d)}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Hora corta "HH:MM" a partir de un ISO. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Nombre completo del mes, para el encabezado de la semana. */
export function fullMonthLabel(dateStr: string): string {
  return MONTH_FMT.format(parseDateStr(dateStr));
}
