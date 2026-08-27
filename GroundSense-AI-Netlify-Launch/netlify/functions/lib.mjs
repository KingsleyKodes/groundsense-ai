import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { STATIONS } from "./data.mjs";

export const store = () => getStore({ name:"groundsense-workshop", consistency:"strong" });
export const hash = (s="") => createHash("sha256").update(String(s)).digest("hex");
export const cleanCode = (s="") => String(s).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);
export const cleanTeam = (s="") => {
  const n=Number.parseInt(s,10);
  return Number.isFinite(n)&&n>=1&&n<=30 ? String(n) : null;
};
export function json(data,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}});}
export async function getSession(code){
  return await store().get(`session/${code}`,{type:"json",consistency:"strong"});
}
export async function requireSession(code){
  const s=await getSession(code);
  if(!s) throw Object.assign(new Error("Session not found. Check the session code."),{status:404});
  return s;
}
export async function listDiscoveries(code,team){
  const s=store();
  const prefix=`discoveries/${code}/${team}/`;
  const listed=await s.list({prefix});
  const ids=listed.blobs.map(b=>b.key.split("/").pop());
  return STATIONS.filter(x=>ids.includes(x.id)).map(({id,source,text})=>({id,source,text}));
}
export async function getAnalysis(code,team){
  return await store().get(`analysis/${code}/${team}`,{type:"json",consistency:"strong"});
}
export async function getDecision(code,team){
  return await store().get(`decision/${code}/${team}`,{type:"json",consistency:"strong"});
}
export function safeErr(e){return json({error:e?.message||"Unexpected error"},e?.status||500);}
