'use client';
import { cornerNames, Setting } from '@/lib/trackside/model';
type Point=[number,number,number];
// One orthographic isometric projection for every tube, wheel and axle.
// x = car right, y = front, z = up. No screen-space wheel rotations.
const project=([x,y,z]:Point)=>[300+.8660254*(x+y),265+.5*(x-y)-z];
const points=(vertices:Point[])=>vertices.map(v=>project(v).join(',')).join(' ');
const line=(a:Point,b:Point)=>`M${project(a)}L${project(b)}`;
const ring=(x:number,y:number,z:number,r:number):Point[]=>Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return [x,y+Math.sin(a)*r,z+Math.cos(a)*r];});
const wheels:[Setting['corner'],number,number][]=[['LF',-101,126],['LR',-101,-126],['RF',101,126],['RR',101,-126]];
export default function Chassis({onSelect,changed=[]}:{onSelect:(corner:Setting['corner'])=>void;changed?:string[]}) {
 const tubes:[Point,Point][]=[];
 const tube=(a:Point,b:Point)=>tubes.push([a,b]);
 for(const side of [-1,1]) {
  tube([side*59,-169,35],[side*59,169,35]);
  tube([side*59,-65,35],[side*50,-48,118]);
  tube([side*59,62,35],[side*50,38,118]);
  tube([side*50,-48,118],[side*50,38,118]);
  tube([side*50,-48,118],[side*59,-156,35]);
  tube([side*50,38,118],[side*59,130,35]);
  tube([side*59,-65,35],[side*50,38,118]);
 }
 for(const y of [-169,-65,62,169])tube([-59,y,35],[59,y,35]);
 for(const y of [-48,38])tube([-50,y,118],[50,y,118]);
 tube([-59,-169,35],[59,-65,35]);tube([59,-169,35],[-59,-65,35]);
 tube([-59,62,35],[59,169,35]);tube([59,62,35],[-59,169,35]);
 const wheel=([corner,x,y]:typeof wheels[number])=>{const near=ring(x+18,y,31,31),far=ring(x-18,y,31,31),highlight=changed.some(id=>id.startsWith(corner.toLowerCase()+'_'));return <g key={corner} className="wheel-target" role="button" tabIndex={0} aria-label={`Go to ${cornerNames[corner]} settings`} onClick={()=>onSelect(corner)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(corner);}}}>
  <polygon points={points(far)} fill="#c2ccd0" stroke="#52636d" strokeWidth="1.4"/>
  <polygon points={points([...far.slice(0,25),...near.slice(0,25).reverse()])} fill="#acb9c0" stroke="#52636d" strokeWidth="1.4"/>
  <polygon points={points(near)} fill="#d8e0e3" stroke={highlight?'#d27816':'#52636d'} strokeWidth={highlight?2.8:1.6}/>
  <polygon points={points(ring(x+18,y,31,18))} fill="#f8fafb" stroke="#6b7c86" strokeWidth="1.4"/>
  {[0,1,2,3,4].map(i=>{const a=i*Math.PI*2/5;return <path key={i} d={line([x+19,y,31],[x+19,y+Math.sin(a)*15,31+Math.cos(a)*15])} stroke="#8a9ba4" strokeWidth="2"/>;})}
 </g>;};
 return <svg className="chassis-svg" viewBox="0 0 600 440" role="img" aria-label="Symmetric isometric chassis locator. Front points upper right. Left and right use the driver's perspective. Not to scale.">
 <defs><pattern id="paper-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#d9e2e6" strokeWidth=".65"/></pattern></defs>
 <rect x="12" y="12" width="576" height="416" rx="18" fill="url(#paper-grid)"/>
 <polygon points={points([[-130,-190,0],[130,-190,0],[130,190,0],[-130,190,0]])} fill="#edf2f4" stroke="#ccd8de" strokeDasharray="4 7"/>
 <g>{wheels.filter(([,x])=>x<0).map(wheel)}</g>
 <polygon points={points([[-59,-65,34],[59,-65,34],[59,62,34],[-59,62,34]])} fill="#dce5e9" stroke="#9cadaf"/>
 <g fill="none" strokeLinecap="round" strokeLinejoin="round">
 <path d={line([-102,-126,31],[102,-126,31])} stroke="#657d8a" strokeWidth="8"/>
 <path d={line([0,-126,36],[0,99,36])} stroke="#879aa4" strokeWidth="5"/>
 {[-1,1].map(side=><g key={side}>
  <path d={line([side*55,92,35],[side*101,126,31])+line([side*101,126,31],[side*55,153,35])} stroke="#718999" strokeWidth="3"/>
  <path d={line([side*56,-45,35],[side*91,-126,31])+line([side*56,-48,61],[side*91,-126,45])} stroke="#799592" strokeWidth="3"/>
  {[-126,126].map(y=><path key={y} d={line([side*59,y-9,64],[side*93,y,31])} stroke="#cd922d" strokeWidth="5"/>)}
 </g>)}
 </g>
 <polygon points={points([[-29,80,53],[29,80,53],[29,132,53],[-29,132,53]])} fill="#aabec9" stroke="#667f8e" strokeWidth="2"/>
 <polygon points={points([[-38,-145,51],[38,-145,51],[38,-102,51],[-38,-102,51]])} fill="#e4c98b" stroke="#aa8b4f" strokeWidth="1.5"/>
 <g fill="none" strokeLinecap="round" strokeLinejoin="round">{tubes.map(([a,b],i)=><g key={i}><path d={line(a,b)} stroke="#f8fbfc" strokeWidth="6"/><path d={line(a,b)} stroke="#597587" strokeWidth="3"/></g>)}
 <path d={line([-59,-123,59],[20,-126,33])} stroke="#439891" strokeWidth="4"/>
 </g>
 <g>{wheels.filter(([,x])=>x>0).map(wheel)}</g>
 {wheels.map(([corner,x,y])=>{const [sx,sy]=project([x,y,83]);return <g key={corner} aria-hidden="true"><rect x={sx-17} y={sy-13} width="34" height="24" rx="6" fill="#fff" stroke="#aebfc9"/><text x={sx} y={sy+3} textAnchor="middle" fill="#2b526a" fontSize="12" fontWeight="750">{corner}</text></g>;})}
 <path d="M472 99l36-21m-11-1 11 1-4 10" fill="none" stroke="#6b8696" strokeWidth="1.6"/>
 <text x="454" y="65" fill="#597587" fontSize="11" fontWeight="650" letterSpacing="2">FRONT</text>
 <text x="300" y="420" textAnchor="middle" fill="#728690" fontSize="10" letterSpacing="1.6">CHASSIS LOCATOR · DRIVER’S LEFT / RIGHT</text>
 </svg>;
}
