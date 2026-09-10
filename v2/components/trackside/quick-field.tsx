'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';

/** Edits stay visible on a failed save. Blur or Enter saves without opening a menu. */
export default function QuickField({label,value,unit='',multiline=false,disabled=false,changed=false,maxLength=4000,storageKey,onSave}:{label:string;value:string;unit?:string;multiline?:boolean;disabled?:boolean;changed?:boolean;maxLength?:number;storageKey?:string;onSave:(value:string)=>Promise<boolean>}) {
 const [draft,setDraft]=useState(value),[saving,setSaving]=useState(false);
 const previous=useRef(value),inFlight=useRef(false);
 useEffect(()=>{const old=previous.current;setDraft(current=>current===old?value:current);previous.current=value;},[value]);
 useEffect(()=>{if(disabled){setDraft(value);return;}if(storageKey){try{const stored=localStorage.getItem(storageKey);if(stored!==null&&stored!==value)setDraft(stored);}catch{}}},[storageKey,disabled]);
 const save=async()=>{if(inFlight.current||draft===value||disabled)return;inFlight.current=true;setSaving(true);try{const saved=await onSave(draft);if(saved&&storageKey){try{localStorage.removeItem(storageKey);}catch{}}}finally{inFlight.current=false;setSaving(false);}};
 const dirty=draft!==value;
 const props={value:draft,disabled:disabled||saving,maxLength,placeholder:'—',onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{setDraft(e.target.value);if(storageKey){try{localStorage.setItem(storageKey,e.target.value);}catch{}}},onBlur:()=>void save(),'aria-label':label};
 return <label className={`quick-field ${multiline?'multiline':''} ${changed?'changed':''} ${dirty?'unsaved':''}`}><span className="quick-label">{label}</span><span className="quick-control">{multiline?<textarea {...props} rows={2}/>:<input {...props} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/>} {unit&&<small>{unit}</small>}{saving?<LoaderCircle className="spin field-saving" size={13}/>:dirty&&!disabled?<button type="button" className="field-save" aria-label={`Save ${label}`} onMouseDown={e=>e.preventDefault()} onClick={()=>void save()}><Check size={15}/></button>:null}</span></label>;
}
