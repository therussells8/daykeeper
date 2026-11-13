import { z } from 'zod';
export const entrySchema = z.object({
  id: z.string().uuid(), kind: z.enum(['task','birthday','event']),
  title: z.string().trim().min(1).max(180),
  date: z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, 'Choose a valid date'),
  priority: z.enum(['normal','high']), completed: z.boolean(),
  annual: z.boolean(), reminder: z.number().int().min(0).max(30),
  notes: z.string().max(2000),
}).refine(v => v.kind === 'task' || !!v.date, 'Events need a date');
export type Entry = z.infer<typeof entrySchema>;
export function localDate(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function occurrence(e: Entry, today: string): string {
  if (!e.date || !e.annual || e.kind === 'task') return e.date;
  const year = Number(today.slice(0,4));
  const inYear = (y: number) => {
    const month = Number(e.date.slice(5,7));
    const day = Math.min(Number(e.date.slice(8)), new Date(y,month,0).getDate());
    return `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  };
  const date = inYear(year); return date < today ? inYear(year+1) : date;
}
export function daysUntil(date: string, today: string) { return Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000); }
