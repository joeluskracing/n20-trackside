'use client';
import { cornerNames, Setting } from '@/lib/trackside/model';
type Point=[number,number,number];
const p=([x,y,z]:Point)=>[400+x*1.3-y*.76,248+x*.36+y*.48-z*1.15];
const points=(v:Point[])=>v.map(a=>p(a).join(',')).join(' ');
export default function Chassis({onSelect,changed=[]}:{onSelect:(corner:Setting['corner'])=>void;changed?:string[]}){
 const tubes:[Point,Point][]=[
 [[-65,-170,0],[-65,170,0]],[[65,-170,0],[65,170,0]],[[-65,-170,0],[65,-170,0]],[[-65,170,0],[65,170,0]],[[-65,-90,0],[65,-90,0]],[[-65,70,0],[65,70,0]],
 [[-65,-170,0],[65,-90,0]],[[65,-170,0],[-65,-90,0]],[[-65,70,0],[65,170,0]],[[65,70,0],[-65,170,0]],
 [[-65,-20,0],[-55,-15,78]],[[65,-20,0],[55,-15,78]],[[-65,85,0],[-55,65,78]],[[65,85,0],[55,65,78]],
 [[-55,-15,78],[55,-15,78]],[[-55,65,78],[55,65,78]],[[-55,-15,78],[-55,65,78]],[[55,-15,78],[55,65,78]],
 [[-65,-90,0],[-55,-15,78]],[[65,-90,0],[55,-15,78]],[[-55,65,78],[-65,170,0]],[[55,65,78],[65,170,0]],
 [[-65,85,0],[-55,-15,78]],[[-65,-20,0],[-55,65,78]],[[65,85,0],[55,-15,78]],
 ];
 const wheelPositions:[Setting['corner'],Point][]=[['LF',[-107,-130,0]],['RF',[107,-130,0]],['LR',[-107,140,0]],['RR',[107,140,0]]];
 return <svg className="chassis-svg" viewBox="0 0 800 475" role="img" aria-label="Isometric chassis schematic, front pointing toward the upper right. Select a corner to edit its setup. Diagram is not to scale.">
  <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .28 -.65 .4 400 135)"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#314253" strokeWidth="1"/></pattern><linearGradient id="tube" x1="0" x2="1"><stop stopColor="#7d9aac"/><stop offset="1" stopColor="#314859"/></linearGradient></defs>
  <rect width="800" height="475" fill="url(#grid)" opacity=".42"/>
  <polygon points={points([[-138,-185,-12],[138,-185,-12],[138,190,-12],[-138,190,-12]])} fill="#0b121b" opacity=".5" stroke="#3a4c5c" strokeDasharray="4 8"/>
  <text x="550" y="92" fill="#869ba9" fontSize="13" letterSpacing="3" transform="rotate(-31 550 92)">FRONT ↗</text>
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">{tubes.map(([a,b],i)=><path key={i} d={`M${p(a)}L${p(b)}`} stroke="url(#tube)" strokeWidth={i<10?5:3.5}/>)}
   <path d={`M${p([-110,140,2])}L${p([110,140,2])}`} stroke="#a4b3be" strokeWidth="9"/>
   <path d={`M${p([0,-110,7])}L${p([0,138,7])}`} stroke="#6b8395" strokeWidth="8"/>
   <path d={`M${p([-65,125,23])}L${p([17,140,2])}`} stroke="#c9f36b" strokeWidth="4"/>
   {[-1,1].map(sign=><g key={sign}><path d={`M${p([sign*60,60,0])}L${p([sign*91,140,0])}M${p([sign*60,65,32])}L${p([sign*91,140,12])}`} stroke="#a08bd2" strokeWidth="4"/><path d={`M${p([sign*65,-90,0])}L${p([sign*105,-130,0])}L${p([sign*65,-155,0])}`} stroke="#869dab" strokeWidth="4"/></g>)}
  </g>
  <polygon points={points([[-35,-130,9],[35,-130,9],[35,-63,9],[-35,-63,9]])} fill="#1b2a36" stroke="#8b9cab" strokeWidth="2"/>
  <path d={`M${p([-20,-125,15])}L${p([-20,-69,15])}M${p([20,-125,15])}L${p([20,-69,15])}`} stroke="#627d91" strokeWidth="12"/>
  <polygon points={points([[-42,17,14],[-7,17,14],[-7,57,14],[-42,57,14]])} fill="#263344" stroke="#8195a5"/>
  {wheelPositions.map(([corner,pt])=>{const [x,y]=p(pt);const changedCorner=changed.some(id=>id.startsWith(corner.toLowerCase()+'_'));return <g key={corner} className="wheel-target" onClick={()=>onSelect(corner)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(corner);}}} tabIndex={0} role="button" aria-label={`Edit ${cornerNames[corner]} settings`}>
   <g transform={`translate(${x},${y}) rotate(16)`}><rect x="-19" y="-37" width="42" height="70" rx="14" fill="#101820" stroke={changedCorner?'#c9f36b':'#647c8d'} strokeWidth="2"/><ellipse cx="-11" cy="-1" rx="18" ry="34" fill="#141f2b" stroke="#7b91a1" strokeWidth="2"/><ellipse cx="-12" cy="-1" rx="10" ry="20" fill="#283b4b" stroke="#496475"/>{[-20,-10,0,10,20].map(d=><path key={d} d={`M7 ${d-3}l13 2`} stroke="#354a5a"/>)}</g>
   <circle cx={x} cy={y-53} r="17" fill={changedCorner?'#c9f36b':'#142435'} stroke={changedCorner?'#c9f36b':'#526f84'}/><text x={x} y={y-48} textAnchor="middle" fill={changedCorner?'#142015':'#d9e8f3'} fontSize="13" fontWeight="700">{corner}</text>
  </g>})}
  <text x="400" y="448" textAnchor="middle" fontSize="12" letterSpacing="2" fill="#6b8193">CHASSIS SCHEMATIC · NOT TO SCALE</text>
 </svg>;
}
