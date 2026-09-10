import { z } from 'zod';
export const corners = ['LF','RF','LR','RR','Center','Rear'] as const;
export const cornerNames = {LF:'Left front',RF:'Right front',LR:'Left rear',RR:'Right rear',Center:'Center',Rear:'Rear geometry'};
export const palette = ['#c9f36b','#58b7ff','#b698fc','#ffb35b','#ff7892','#8b9aa8'];
export const settingSchema = z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),corner:z.enum(corners),label:z.string().min(1).max(100),value:z.string().max(4000),unit:z.string().max(40),kind:z.enum(['number','text','table']),reference:z.string().max(300).default('')});
export type Setting = z.infer<typeof settingSchema>;
export const sessionSchema = z.object({id:z.string().min(1).max(100),car:z.string().min(1).max(100),track:z.string().min(1).max(100),name:z.string().min(1).max(100),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),status:z.enum(['draft','recorded']),parentId:z.string().max(100),revision:z.number().int().min(0),createdAt:z.string(),updatedAt:z.string(),settings:z.array(settingSchema).max(240),notes:z.object({start:z.string().max(40),finish:z.string().max(40),laps:z.string().max(40),conditions:z.string().max(2000),before:z.string().max(8000),after:z.string().max(8000),feedback:z.string().max(8000)}),attachments:z.array(z.object({id:z.string().max(100),name:z.string().max(200),type:z.string().max(100)})).max(100)});
export type Session = z.infer<typeof sessionSchema>;
export type Summary = Pick<Session,'id'|'car'|'track'|'name'|'date'|'color'|'status'|'revision'|'updatedAt'|'parentId'>;
export type Change = {field:string;label:string;before:string;after:string};
export type Activity = {id:string;revision:number;createdAt:string;source:string;message:string;summary:string;changes:Change[]};
export type Proposal = {summary:string;track:string|null;sessionName:string|null;date:string|null;createSession:boolean;changes:{id:string;operation:'set'|'delta';value:string;unit:string;explicit:boolean;evidence:string}[];notes:{field:keyof Session['notes'];value:string}[];questions:string[]};
export function localDate() {return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function defaultSettings(): Setting[] {
  const out:Setting[]=[];
  const add=(corner:Setting['corner'],key:string,label:string,unit='',kind:Setting['kind']='number',reference='')=>out.push({id:`${corner.toLowerCase()}_${key}`,corner,label,unit,kind,value:'',reference});
  for(const c of ['LF','RF','LR','RR'] as const) {
    add(c,'spring','Spring rate','lb/in');add(c,'rebound','Rebound','clicks','number','');add(c,'compression','Compression','clicks','number','');add(c,'pressure','Cold tire pressure','psi');
    add(c,'ride_height','Ride height','in');add(c,'preload','Spring preload','in');add(c,'smash','Smash numbers','','table','Include eye-to-eye reference and travel/load pairs.');add(c,'tire','Tire / compound','','text');
    add(c,'hot_pressure','Hot tire pressure','psi');add(c,'weight','Corner weight','lb');
    if(c==='LF'||c==='RF'){add(c,'camber','Camber','deg');add(c,'caster','Caster','deg');}
    else {add(c,'upper_bar','Upper bar angle','deg');add(c,'lower_bar','Lower bar angle','deg');add(c,'upper_hole','Upper bar chassis hole','','text','Record your numbering convention.');add(c,'lower_hole','Lower bar chassis hole','','text');add(c,'upper_length','Upper bar length','in');add(c,'lower_length','Lower bar length','in');}
  }
  add('Center','gear','Gear ratio',':1');add('Center','fifth_spring','5th coil spring','lb/in');add('Center','fifth_compression','5th coil compression','clicks');add('Center','fifth_rebound','5th coil rebound','clicks');add('Center','fifth_location','5th coil location','in');add('Center','fuel','Starting fuel','gal');add('Center','brake_bias','Front brake bias','%');add('Center','toe','Front toe','in');
  add('Rear','jbar_chassis','J-bar chassis height','in');add('Rear','jbar_pinion','J-bar pinion height','in');add('Rear','jbar_length','J-bar length','in');add('Rear','stagger','Rear stagger','in');add('Rear','rear_steer','Rear steer','','text');add('Rear','pinion','Pinion angle','deg');add('Rear','axle_offset','Rear axle offset','in');
  return out;
}
export function newSession(base?:Session,meta:Partial<Session>={}):Session {
 const now=new Date().toISOString();
 return sessionSchema.parse({id:crypto.randomUUID(),car:base?.car||'N20 · Dirt Late Model',track:base?.track||'Garage',name:'Baseline',date:localDate(),color:palette[0],status:'draft',parentId:base?.id||'',revision:0,createdAt:now,updatedAt:now,settings:base?structuredClone(base.settings):defaultSettings(),notes:{start:'',finish:'',laps:'',conditions:'',before:'',after:'',feedback:''},attachments:[],...meta});
}
export function changesBetween(a:Session,b:Session):Change[] {
 const changes:Change[]=[];
 for(const s of b.settings){const old=a.settings.find(v=>v.id===s.id);if(!old||old.value!==s.value||old.unit!==s.unit||old.label!==s.label||old.corner!==s.corner||old.kind!==s.kind||old.reference!==s.reference)changes.push({field:s.id,label:`${s.corner} ${s.label}`,before:old?`${old.value||'Not recorded'} ${old.unit}`.trim():'Not recorded',after:`${s.value||'Not recorded'} ${s.unit}`.trim()});}
 for(const s of a.settings)if(!b.settings.some(v=>v.id===s.id))changes.push({field:s.id,label:`${s.corner} ${s.label}`,before:s.value||'Not recorded',after:'Removed'});
 for(const k of Object.keys(b.notes) as (keyof Session['notes'])[])if(a.notes[k]!==b.notes[k])changes.push({field:`notes.${k}`,label:k,before:a.notes[k],after:b.notes[k]});
 for(const k of ['track','name','date','color','car','status'] as const)if(a[k]!==b[k])changes.push({field:k,label:k,before:a[k],after:b[k]});
 return changes;
}
export function numberValue(raw:string):number|null {
 const v=raw.trim();if(/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))return Number(v);
 const m=v.match(/^(-?)(?:(\d+)\s+)?(\d+)\/(\d+)$/);if(m&&Number(m[4]))return(m[1]?-1:1)*(Number(m[2]||0)+Number(m[3])/Number(m[4]));return null;
}
export function applyProposal(base:Session,p:Proposal) {
 const next=structuredClone(base),pending=[...p.questions];
 for(const c of p.changes){const s=next.settings.find(s=>s.id===c.id);if(!s){pending.push(`Unknown setting: ${c.id}`);continue;}
  if(!c.explicit){pending.push(`Confirm ${s.corner} ${s.label}: ${c.evidence||c.value}`);continue;}
  if(c.unit&&c.unit.toLowerCase()!==s.unit.toLowerCase()){pending.push(`Confirm units for ${s.corner} ${s.label}: ${c.unit} versus ${s.unit||'unspecified'}.`);continue;}
  if(c.operation==='delta') {const old=numberValue(s.value),delta=numberValue(c.value);if(old===null||delta===null){pending.push(`${s.corner} ${s.label}: starting value needed for ${c.value}.`);continue;}s.value=String(Math.round((old+delta)*1000000)/1000000);}
  else if(s.kind==='number'&&c.value!==''&&numberValue(c.value)===null){pending.push(`Confirm numeric value for ${s.corner} ${s.label}: ${c.value}`);}
  else s.value=c.value;
 }
 for(const n of p.notes){if(['start','finish','laps'].includes(n.field))next.notes[n.field]=n.value;else next.notes[n.field]=[next.notes[n.field],n.value].filter(Boolean).join('\n');}
 return {session:next,pending:[...new Set(pending)]};
}
