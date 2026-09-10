import { Session, sessionSchema, newSession } from './model';
const header=['record_type','key','corner','label','value','unit','kind','reference'];
// Reversible spreadsheet-formula protection. Leading apostrophes are doubled.
export function csvCell(v:unknown):string {let s=String(v??'');if(/^[=+@\t\r']/.test(s)||(/^-/.test(s)&&!/^-[\d.]+$/.test(s)))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function encodeRows(rows:unknown[][]) {return rows.map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';}
export function parseRows(csv:string):string[][] {
 if(csv.length>2_000_000)throw Error('CSV must be smaller than 2 MB.');
 const rows:string[][]=[];let row:string[]=[],v='',quote=false,closed=false;
 const field=()=>{row.push(v.startsWith("'")?v.slice(1):v);v='';closed=false;};
 const line=()=>{field();if(row.some(v=>v!==''))rows.push(row);row=[];if(rows.length>10000)throw Error('Too many CSV rows.');};
 const s=csv.replace(/^\uFEFF/,'');
 for(let i=0;i<s.length;i++){const c=s[i];if(quote){if(c==='"'){if(s[i+1]==='"'){v+='"';i++;}else{quote=false;closed=true;}}else v+=c;}else if(c==='"'&&!v&&!closed)quote=true;else if(c===',')field();else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;line();}else {if(closed)throw Error('Invalid CSV quoting.');v+=c;}}
 if(quote)throw Error('Unclosed quoted CSV field.');if(v||row.length||closed)line();return rows;
}
export function toCsv(s:Session):string {
 const rows:unknown[][]=[header,['schema','version','','','2','','','']];
 for(const key of ['id','car','track','name','date','color','status','parentId','revision','createdAt','updatedAt'] as const)rows.push(['session',key,'',key,s[key],'','','']);
 for(const p of s.settings)rows.push(['setting',p.id,p.corner,p.label,p.value,p.unit,p.kind,p.reference]);
 for(const [k,v] of Object.entries(s.notes))rows.push(['note',k,'',k,v,'','','']);
 for(const a of s.attachments)rows.push(['attachment',a.id,'',a.name,'',a.type,'','']);
 return encodeRows(rows);
}
export function fromCsv(csv:string):Session {
 const rows=parseRows(csv);if(rows[0]?.join(',')!==header.join(','))throw Error('This is not a Trackside v2 CSV. Use a Trackside session export.');
 if(!rows.some(r=>r[0]==='schema'&&r[1]==='version'&&r[4]==='2'))throw Error('Unsupported CSV version.');
 const s:any=newSession();s.settings=[];s.attachments=[];const seen=new Set<string>();
 for(const row of rows.slice(1)){if(row.length!==header.length)throw Error('Every row must have eight columns.');const [type,k,corner,label,value,unit,kind,reference]=row;
 if(seen.has(type+':'+k))throw Error(`Duplicate CSV row: ${k}`);seen.add(type+':'+k);
 if(type==='session'){if(!['id','car','track','name','date','color','status','parentId','revision','createdAt','updatedAt'].includes(k))throw Error('Unknown session field.');s[k]=k==='revision'?Number(value):value;}
 else if(type==='setting')s.settings.push({id:k,corner,label,value,unit,kind,reference});
 else if(type==='note'){if(!Object.prototype.hasOwnProperty.call(s.notes,k))throw Error('Unknown note field.');s.notes[k]=value;}
 else if(type==='attachment')s.attachments.push({id:k,name:label,type:unit});
 else if(type!=='schema')throw Error('Unknown row type.');
 }
 if(!seen.has('session:track')||!seen.has('session:name')||!seen.has('session:date'))throw Error('Session identity is missing.');
 return sessionSchema.parse(s);
}
