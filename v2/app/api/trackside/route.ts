import { getChatGPTUser } from '@/app/chatgpt-auth';
import { z } from 'zod';
import { ApiError,db,bucket,getSession,listSessions,save,history } from '@/lib/trackside/store';
import { Session,newSession,sessionSchema,settingSchema,applyProposal,changesBetween,localDate } from '@/lib/trackside/model';
import { fromCsv,toCsv,encodeRows } from '@/lib/trackside/csv';
import { interpret,connection,connect,transcribe } from '@/lib/trackside/ai';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function owner(){const user=await getChatGPTUser();if(!user)throw new ApiError('Sign in to use your notebook.',401);return user.userId;}
function error(e:unknown){if(e instanceof ApiError)return json({error:e.message},e.status);if(e instanceof z.ZodError)return json({error:'Some fields are invalid. Check your entry and try again.'},400);console.error('Trackside request failed',e instanceof Error?e.name:'Error');return json({error:'Could not complete this request. Your input is preserved; please try again.'},503);}
function safeFilename(s:string){return s.replace(/[^a-zA-Z0-9_.-]/g,'-').slice(0,180);}
function download(body:string,name:string){return new Response('\uFEFF'+body,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${safeFilename(name)}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function GET(req:Request){try{const user=await owner(),url=new URL(req.url),op=url.searchParams.get('op'),id=url.searchParams.get('id')||'';
 if(op==='session'){const s=await getSession(user,id);return json({session:s,history:await history(user,id),parent:s.parentId?await getSession(user,s.parentId).catch(()=>null):null});}
 if(op==='csv'){const s=await getSession(user,id);return download(toCsv(s),`${s.date}-${s.track}-${s.name}.csv`);}
 if(op==='event-csv'){const s=await getSession(user,id),ss=(await listSessions(user)).filter(r=>r.track===s.track&&r.date===s.date&&r.car===s.car);const rows:unknown[][]=[['session_id','car','track','date','session','status','record_type','corner','setting','value','unit','reference']];for(const row of ss){const item=await getSession(user,row.id);for(const f of item.settings)rows.push([item.id,item.car,item.track,item.date,item.name,item.status,'setting',f.corner,f.label,f.value,f.unit,f.reference]);for(const [k,v] of Object.entries(item.notes))rows.push([item.id,item.car,item.track,item.date,item.name,item.status,'note','',k,v,'','']);}return download(encodeRows(rows),`${s.date}-${s.track}-race.csv`);}
 if(op==='history-csv'){const s=await getSession(user,id);const r=await db().prepare('SELECT * FROM revisions WHERE owner=? AND session_id=? ORDER BY revision').bind(user,id).all<any>();return download(encodeRows([['session_id','revision','timestamp','source','original_message','summary','changes','snapshot_csv'],...r.results.map(r=>[id,r.revision,r.created_at,r.source,r.message,r.summary,r.changes,r.csv])]),`${s.date}-${s.track}-${s.name}-history.csv`);}
 if(op==='attachment'){const a=await db().prepare('SELECT * FROM attachments WHERE id=? AND owner=?').bind(id,user).first<any>();if(!a)throw new ApiError('Attachment not found.',404);const obj=await bucket().get(a.object_key);if(!obj)throw new ApiError('Attachment not found.',404);return new Response(obj.body,{headers:{'Content-Type':a.type,'Content-Disposition':`inline; filename="${safeFilename(a.name)}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}
 if(op==='revision'){await getSession(user,id);const r=await db().prepare('SELECT csv FROM revisions WHERE owner=? AND session_id=? AND revision=?').bind(user,id,Number(url.searchParams.get('revision'))).first<{csv:string}>();if(!r)throw new ApiError('Revision not found.',404);return json({session:fromCsv(r.csv)});}
 return json({sessions:await listSessions(user),connection:await connection(user)});
 }catch(e){return error(e);}}
const metaSchema=sessionSchema.pick({car:true,track:true,name:true,date:true,color:true}).partial();
async function validateAttachments(owner:string,s:Session){for(const a of s.attachments){const r=await db().prepare('SELECT name,type FROM attachments WHERE id=? AND owner=?').bind(a.id,owner).first<{name:string;type:string}>();if(!r)throw new ApiError('An attachment is unavailable. Please attach it again.');a.name=r.name;a.type=r.type;}}
export async function POST(req:Request){try{const user=await owner();if(req.headers.get('sec-fetch-site')==='cross-site')throw new ApiError('Cross-site requests are not allowed.',403);const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new ApiError('Invalid request origin.',403);
 if(Number(req.headers.get('content-length')||0)>14_000_000)throw new ApiError('Upload is too large.',413);
 if(req.headers.get('content-type')?.includes('multipart/form-data')){
  const form=await req.formData(),file=form.get('file'),op=form.get('op');if(!(file instanceof File))throw new ApiError('Choose a file.');
  if(op==='transcribe'){if(file.size>10_000_000)throw new ApiError('Recording must be smaller than 10 MB.');if(!/^(audio\/(webm|mp4|mpeg|wav|ogg|x-m4a)|video\/webm)/.test(file.type))throw new ApiError('Unsupported audio format.');return json({text:await transcribe(user,file)});}
  if(file.size>8_000_000)throw new ApiError('Photo must be smaller than 8 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new ApiError('Choose a JPEG, PNG, or WebP photo.');
  const bytes=new Uint8Array(await file.arrayBuffer());const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78:new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';if(!valid)throw new ApiError('The photo file does not match its format.');
  const id=crypto.randomUUID(),key=`${user}/${id}`,name=file.name.slice(0,200);await bucket().put(key,bytes,{httpMetadata:{contentType:file.type}});await db().prepare('INSERT INTO attachments(id,owner,object_key,name,type,size,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,user,key,name,file.type,file.size,new Date().toISOString()).run();return json({attachment:{id,name,type:file.type}});
 }
 const raw=await req.text();if(raw.length>700000)throw new ApiError('Request is too large.',413);let b:any;try{b=JSON.parse(raw);}catch{throw new ApiError('Invalid request.');}
 const op=z.string().parse(b.op);const requestId=z.string().uuid().parse(b.requestId);
 if(['create','import','update','record','undo','apply','note'].includes(op)){const receipt=await db().prepare('SELECT session_id FROM revisions WHERE id=? AND owner=?').bind(requestId,user).first<{session_id:string}>();if(receipt)return json({session:await getSession(user,receipt.session_id)});}
 if(op==='connect'){await connect(user,z.string().max(300).parse(b.key));return json({connection:await connection(user)});}
 if(op==='disconnect'){await db().prepare('DELETE FROM preferences WHERE owner=?').bind(user).run();return json({connection:await connection(user)});}
 if(op==='create'){const base=b.baseId?await getSession(user,z.string().parse(b.baseId)):undefined;const s=newSession(base,metaSchema.parse(b.meta||{}));return json({session:await save(user,s,0,requestId,'create','','Session created')});}
 if(op==='import'){const s=fromCsv(z.string().max(350000).parse(b.csv));s.id=crypto.randomUUID();s.parentId='';s.revision=0;s.createdAt=new Date().toISOString();s.attachments=[];return json({session:await save(user,s,0,requestId,'import','Imported Trackside v2 CSV. Attachment bytes are not included in CSV files.','Imported session')});}
 const id=z.string().max(100).parse(b.id);const current=await getSession(user,id),revision=z.number().int().min(1).parse(b.revision);
 if(current.revision!==revision)throw new ApiError('This session changed on another device. Reload it before saving; your input is preserved.',409);
 if(op==='update'){const s=structuredClone(current);let source='manual',summary='Setting updated';
  if(b.meta){Object.assign(s,metaSchema.parse(b.meta));source='metadata';summary='Session details updated';}
  else if(b.notes){s.notes={...s.notes,...sessionSchema.shape.notes.partial().parse(b.notes)};source='notes';summary='Session notes updated';}
  else if(b.setting){const setting=settingSchema.parse(b.setting);const i=s.settings.findIndex(r=>r.id===setting.id);if(i>=0)s.settings[i]=setting;else s.settings.push(setting);summary=`${setting.corner} ${setting.label} updated`;}
  else if(b.removeSetting){s.settings=s.settings.filter(s=>s.id!==b.removeSetting);summary='Setting removed';}
  else throw new ApiError('No update supplied.');
  return json({session:await save(user,s,revision,requestId,source,'',summary)});
 }
 if(op==='record'){if(current.status==='recorded')return json({session:current});return json({session:await save(user,{...current,status:'recorded'},revision,requestId,'manual','','Setup recorded for this run')});}
 if(op==='undo'){if(revision<=1)throw new ApiError('There is no earlier revision to restore.');const r=await db().prepare('SELECT csv FROM revisions WHERE owner=? AND session_id=? AND revision=?').bind(user,id,revision-1).first<{csv:string}>();if(!r)throw new ApiError('Earlier revision not found.');const previous=fromCsv(r.csv);if(current.status==='recorded'&&previous.status==='draft')throw new ApiError('This run is recorded. Copy it into a new session to change the setup.');return json({session:await save(user,previous,revision,requestId,'undo','','Restored previous revision')});}
 if(op==='parse'){
  const message=z.string().max(12000).parse(b.message||'');let image:undefined|{bytes:ArrayBuffer;type:string};
  if(b.attachment){const a=await db().prepare('SELECT * FROM attachments WHERE owner=? AND id=?').bind(user,z.string().parse(b.attachment.id)).first<any>();if(!a)throw new ApiError('Photo not found.');const obj=await bucket().get(a.object_key);if(!obj)throw new ApiError('Photo not found.');image={bytes:await obj.arrayBuffer(),type:a.type};}
  const result=await interpret(user,message,current,image);let target=current,base=current;const p=result.proposal;
  let newTarget=p.createSession;let routingIssue='';
  if(newTarget){base=newSession(current,{track:p.track||current.track,name:p.sessionName||'Next session',date:p.date||localDate()});if(!p.sessionName)routingIssue='Name the next session before saving.';}
  else if((p.track&&p.track.toLowerCase()!==current.track.toLowerCase())||(p.sessionName&&p.sessionName.toLowerCase()!==current.name.toLowerCase())||(p.date&&p.date!==current.date)){
   const matches=(await listSessions(user)).filter(s=>(s.track.toLowerCase()===(p.track||current.track).toLowerCase())&&(s.name.toLowerCase()===(p.sessionName||current.name).toLowerCase())&&s.date===(p.date||current.date)&&s.car===current.car);
   if(matches.length===1){target=await getSession(user,matches[0].id);base=target;}else routingIssue='That session is missing or ambiguous. Select it or create it first.';
  }
  const applied=applyProposal(base,p);if(routingIssue)applied.pending.push(routingIssue);
  if(base.status==='recorded'&&p.changes.length)applied.pending.push('This run is locked. Start the next session to record setup changes.');
  return json({proposal:p,engine:result.engine,preview:applied.session,pending:applied.pending,changes:changesBetween(base,applied.session),targetId:target.id,targetRevision:target.revision,newTarget,blocked:!!routingIssue||(base.status==='recorded'&&p.changes.length>0),needsReview:!!image||applied.pending.length>0||newTarget||target.id!==current.id});
 }
 if(op==='apply'){
  const next=sessionSchema.parse(b.preview);const creating=z.boolean().parse(b.newTarget);const message=z.string().max(12000).parse(b.message||'');const summary=z.string().max(2000).parse(b.summary||'Entry recorded');
  if(creating){next.id=crypto.randomUUID();next.parentId=current.id;next.status='draft';next.createdAt=new Date().toISOString();}
  else {if(next.id!==current.id)throw new ApiError('Selected session mismatch.');next.parentId=current.parentId;next.createdAt=current.createdAt;next.status=current.status;}
  if(b.attachment&&!next.attachments.some(a=>a.id===b.attachment.id))next.attachments.push(b.attachment);
  await validateAttachments(user,next);
  if(current.status==='recorded'&&!creating&&changesBetween(current,next).some(c=>!c.field.startsWith('notes.')))throw new ApiError('This setup is locked. Only results and notes can be added.');
  return json({session:await save(user,next,creating?0:revision,requestId,creating?'create':current.status==='recorded'?'notes':'chat',message,summary)});
 }
 if(op==='note'){const message=z.string().min(1).max(12000).parse(b.message);const s=structuredClone(current);s.notes.feedback=[s.notes.feedback,message].filter(Boolean).join('\n');if(b.attachment)s.attachments.push(b.attachment);await validateAttachments(user,s);return json({session:await save(user,s,revision,requestId,'notes',message,'Saved original entry as a note')});}
 throw new ApiError('Unknown action.');
 }catch(e){return error(e);}}
