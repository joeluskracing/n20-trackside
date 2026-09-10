import { env } from 'cloudflare:workers';
import { Session, sessionSchema, changesBetween, numberValue } from './model';
import { toCsv,fromCsv } from './csv';
export function db(){if(!env.DB)throw Error('Notebook storage is unavailable. Please try again.');return env.DB;}
export function bucket(){if(!env.BUCKET)throw Error('Photo storage is unavailable. Please try again.');return env.BUCKET;}
export class ApiError extends Error{constructor(message:string,public status=400){super(message);}}
export async function getSession(owner:string,id:string):Promise<Session>{const r=await db().prepare('SELECT csv FROM sessions WHERE id=? AND owner=?').bind(id,owner).first<{csv:string}>();if(!r)throw new ApiError('Session not found.',404);return fromCsv(r.csv);}
export async function listSessions(owner:string){const r=await db().prepare('SELECT csv FROM sessions WHERE owner=? ORDER BY date DESC,updated_at DESC LIMIT 1000').bind(owner).all<{csv:string}>();return r.results.map(r=>{const s=fromCsv(r.csv);return {id:s.id,car:s.car,track:s.track,name:s.name,date:s.date,color:s.color,status:s.status,revision:s.revision,updatedAt:s.updatedAt,parentId:s.parentId};});}
export async function save(owner:string,session:Session,expected:number,requestId:string,source:string,message:string,summary:string){
 const existing=await db().prepare('SELECT session_id FROM revisions WHERE id=? AND owner=?').bind(requestId,owner).first<{session_id:string}>();
 if(existing)return getSession(owner,existing.session_id);
 let old:Session|undefined;if(expected>0)old=await getSession(owner,session.id);
 if(old&&old.revision!==expected)throw new ApiError('This session changed on another device. Reload it before saving; your input is still here.',409);
 if(old&&old.status==='recorded'&&source!=='notes'&&source!=='metadata'&&source!=='undo')throw new ApiError('This on-track setup is locked. Start the next session to make adjustments.',409);
 const next=sessionSchema.parse({...session,revision:expected+1,updatedAt:new Date().toISOString()});
 if(new Set(next.settings.map(s=>s.id)).size!==next.settings.length)throw new ApiError('Duplicate setting IDs.');
 for(const f of next.settings)if(f.kind==='number'&&f.value!==''&&numberValue(f.value)===null)throw new ApiError(`${f.corner} ${f.label} needs a number or fraction. Put descriptions in a text field or notes.`);
 const csv=toCsv(next);if(csv.length>350000)throw new ApiError('Session is too large. Shorten notes or split the session.');
 const changes=old?changesBetween(old,next):[];
 const stmts=[];
 if(expected===0)stmts.push(db().prepare('INSERT INTO sessions(id,owner,track,name,date,revision,csv,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(next.id,owner,next.track,next.name,next.date,next.revision,csv,next.updatedAt));
 else stmts.push(db().prepare('UPDATE sessions SET track=?,name=?,date=?,revision=?,csv=?,updated_at=? WHERE id=? AND owner=? AND revision=?').bind(next.track,next.name,next.date,next.revision,csv,next.updatedAt,next.id,owner,expected));
 // A UNIQUE(session_id,revision) violation rolls back the entire batch on concurrent writes.
 stmts.push(db().prepare('INSERT INTO revisions(id,session_id,owner,revision,csv,source,message,summary,changes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(requestId,next.id,owner,next.revision,csv,source,message,summary,JSON.stringify(changes),next.updatedAt));
 try{await db().batch(stmts);}catch(e){const receipt=await db().prepare('SELECT session_id FROM revisions WHERE id=? AND owner=?').bind(requestId,owner).first<{session_id:string}>();if(receipt)return getSession(owner,receipt.session_id);if(String(e).includes('UNIQUE'))throw new ApiError('The session was already updated. Reload it before saving.',409);throw e;}
 return next;
}
export async function history(owner:string,id:string){await getSession(owner,id);const r=await db().prepare('SELECT id,revision,source,message,summary,changes,created_at AS createdAt FROM revisions WHERE session_id=? AND owner=? ORDER BY revision DESC LIMIT 100').bind(id,owner).all<any>();return r.results.map(r=>({...r,changes:JSON.parse(r.changes)}));}
export async function reserveAI(owner:string){const date=new Date().toISOString().slice(0,10),key=`${owner}:${date}`;const r=await db().prepare('INSERT INTO ai_usage(bucket,count) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<100 RETURNING count').bind(key).first();if(!r)throw new ApiError('Daily limit of 100 AI requests reached. Manual editing and CSV export still work.',429);}
