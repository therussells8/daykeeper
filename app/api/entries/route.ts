import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { entries } from '@/db/schema';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { entrySchema } from '@/app/model';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control':'no-store' } });
export async function GET() {
  const user = await getChatGPTUser(); if (!user) return json({error:'Please sign in to load your organizer.'},401);
  try { const rows = await getDb().select().from(entries).where(eq(entries.owner,user.userId)); return json(rows.map(r=>JSON.parse(r.data))); }
  catch (error) { console.error('entries_read_failed',error); return json({error:'Could not load your organizer. Please try again.'},503); }
}
async function mutate(request: Request, method: string) {
  const user = await getChatGPTUser(); if (!user) return json({error:'Please sign in to save changes.'},401);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({error:'Invalid request origin.'},403);
  if (Number(request.headers.get('content-length') || 0) > 16000) return json({error:'Request too large.'},413);
  try {
    const raw = await request.text(); if (raw.length > 16000) return json({error:'Request too large.'},413);
    let body; try { body=JSON.parse(raw); } catch { return json({error:'Invalid request.'},400); }
    const db=getDb();
    if (method === 'DELETE') {
      if (typeof body.id !== 'string') return json({error:'Missing entry.'},400);
      await db.delete(entries).where(and(eq(entries.id,body.id),eq(entries.owner,user.userId))); return json({ok:true});
    }
    const parsed=entrySchema.safeParse(body); if (!parsed.success) return json({error:parsed.error.issues[0].message},400);
    const data=parsed.data;
    if (method==='POST') await db.insert(entries).values({id:data.id,owner:user.userId,data:JSON.stringify(data)});
    else await db.update(entries).set({data:JSON.stringify(data)}).where(and(eq(entries.id,data.id),eq(entries.owner,user.userId)));
    return json(data);
  } catch(error) { console.error('entries_write_failed',error); return json({error:'Could not save your change. Please try again.'},503); }
}
export const POST = (r: Request) => mutate(r,'POST');
export const PUT = (r: Request) => mutate(r,'PUT');
export const DELETE = (r: Request) => mutate(r,'DELETE');
