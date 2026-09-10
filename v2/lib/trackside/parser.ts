import { Proposal,Session } from './model';
const normalized=(s:string)=>s.toLowerCase().replace(/left[ -]front/g,'lf').replace(/right[ -]front/g,'rf').replace(/left[ -]rear/g,'lr').replace(/right[ -]rear/g,'rr').replace(/spring rate/g,'spring').replace(/cold tire pressure|tire pressure/g,'pressure').replace(/\s+/g,' ').trim();
export function basicParse(message:string,session:Session):Proposal {
 const p:Proposal={summary:'Note saved',track:null,sessionName:null,date:null,createSession:false,changes:[],notes:[],questions:[]};
 for(const fragment of message.split(/[;\n]+/)){let text=normalized(fragment).replace(/\.$/,'');let matched=false;
  const create=fragment.trim().match(/^(?:new session|start session|next session)\s*:?\s*(.+?)\s+[–—-]\s+(.+)$/i);
  if(create){p.track=create[1].trim();p.sessionName=create[2].trim();p.createSession=true;matched=true;}
  for(const s of session.settings){const names=[normalized(`${s.corner} ${s.label}`)];if(s.corner==='Center'||s.corner==='Rear')names.push(normalized(s.label));if(s.id==='rr_spring')names.push('rr spring');
   for(const name of names){if(!text.startsWith(name+' ')&&!text.startsWith(name+':'))continue;
    let value=text.slice(name.length).replace(/^\s*(?:is|to|=|:)\s*/,'').trim();
    const numeric=value.match(/^(-?\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|-?\d+\/\d+)\s*(psi|clicks?|lb\/in|pounds?|lbs?|inches?|in|degrees?|deg|gal|%)?$/);
    if(numeric){const u=numeric[2];const unit=u?({pound:'lb/in',pounds:'lb/in',lbs:'lb/in',click:'clicks',inch:'in',inches:'in',degree:'deg',degrees:'deg'}[u]||u):s.unit;p.changes.push({id:s.id,operation:'set',value:numeric[1],unit,explicit:true,evidence:fragment});matched=true;break;}
   }if(matched)break;
  }
  if(!matched){const r=text.match(/^started\s+(\d+)(?:st|nd|rd|th)?(?:[, ]+finished\s+(\d+)(?:st|nd|rd|th)?)?$/);if(r){p.notes.push({field:'start',value:r[1]});if(r[2])p.notes.push({field:'finish',value:r[2]});matched=true;}}
  if(!matched&&fragment.trim()){p.notes.push({field:'feedback',value:fragment.trim()});p.questions.push('Saved as a note. Connect AI for conversational adjustments, or use an exact entry such as “RR spring 225”.');}
 }
 if(p.changes.length)p.summary=`Recorded ${p.changes.length} setting${p.changes.length===1?'':'s'}`;
 if(p.createSession)p.summary=`Started ${p.track} — ${p.sessionName}`;
 return p;
}
