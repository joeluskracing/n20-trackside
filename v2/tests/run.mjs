import { createRequire } from 'node:module';
import { mkdir,readFile,readdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url);
const kitRequire=createRequire(require.resolve('drizzle-kit/api'));
const {build}=await import(pathToFileURL(kitRequire.resolve('esbuild')).href);
await mkdir('.sites-runtime/tests',{recursive:true});
const options={bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'};
await build({...options,entryPoints:['tests/domain.test.ts'],outfile:'.sites-runtime/tests/domain.mjs'});
// Exercise the actual route handlers against SQLite transactions. Only platform
// bindings and dispatch identity are substituted; no network or browser is used.
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())sql.exec(await readFile('drizzle/'+f,'utf8'));
class Statement{constructor(query,values=[]){this.query=query;this.values=values;}bind(...values){return new Statement(this.query,values);}async first(){return sql.prepare(this.query).get(...this.values)||null;}async all(){return {results:sql.prepare(this.query).all(...this.values),success:true};}async run(){const r=sql.prepare(this.query).run(...this.values);return {success:true,meta:{changes:Number(r.changes)}};}}
const objects=new Map();globalThis.__testEnv={DB:{prepare:q=>new Statement(q),batch:async statements=>{sql.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}},BUCKET:{put:async(key,bytes)=>objects.set(key,bytes),get:async key=>{const bytes=objects.get(key);return bytes?{body:bytes,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}:null;}}};
await build({...options,entryPoints:['app/api/trackside/route.ts'],outfile:'.sites-runtime/tests/route.mjs',plugins:[{name:'test-platform',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onResolve({filter:/chatgpt-auth$/},()=>({path:'auth',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='env'?'export const env=globalThis.__testEnv;':'export async function getChatGPTUser(){return globalThis.__testUser||null;}',loader:'js'}));}}]});
globalThis.__testRoute=await import(pathToFileURL(process.cwd()+'/.sites-runtime/tests/route.mjs').href);
await import(pathToFileURL(process.cwd()+'/.sites-runtime/tests/domain.mjs').href);
await import('./route.test.mjs');
