import { getStore, getDeployStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { STATIONS } from "./data.mjs";

export function blobStore(){
  const deployContext = typeof Netlify !== "undefined" ? Netlify.context?.deploy?.context : null;
  if(deployContext && deployContext !== "production") return getDeployStore("groundsense-workshop");
  return getStore("groundsense-workshop", { consistency:"strong" });
}

export const hash = (value="") => createHash("sha256").update(String(value)).digest("hex");
export const cleanCode = (value="") => String(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
export const cleanTeam = (value="") => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 && n <= 30 ? String(n) : null;
};
export const cleanText = (value="", max=1200) => String(value ?? "").trim().slice(0, max);

export function json(data, status=200){
  return Response.json(data, { status, headers:{ "Cache-Control":"no-store" } });
}

export function safeErr(error){
  console.error(error);
  return json({ error:error?.message || "Unexpected server error." }, error?.status || 500);
}

export async function getSession(code){
  if(!code) return null;
  return await blobStore().get(`session/${code}`, { type:"json" });
}

export async function requireSession(code){
  const session = await getSession(code);
  if(!session) throw Object.assign(new Error("Session not found. Check the session code with your facilitator."), { status:404 });
  return session;
}

export async function listDiscoveries(code, team){
  const listed = await blobStore().list({ prefix:`discoveries/${code}/${team}/` });
  const ids = new Set(listed.blobs.map(item => item.key.split("/").pop()));
  return STATIONS.filter(item => ids.has(item.id)).map(({id, source, text}) => ({id, source, text}));
}

export async function readJson(key){
  return await blobStore().get(key, { type:"json" });
}

export async function deletePrefix(prefix){
  const store = blobStore();
  const listed = await store.list({ prefix });
  await Promise.all(listed.blobs.map(item => store.delete(item.key)));
  return listed.blobs.length;
}

export function facilitatorPin(req){
  return req.headers.get("x-facilitator-pin") || "";
}

export function assertPin(session, supplied){
  if(!supplied || hash(supplied) !== session.pinHash){
    throw Object.assign(new Error("Incorrect facilitator PIN."), { status:403 });
  }
}

export function aiKey(){
  return Netlify.env.get("OPENAI_API_KEY") || Netlify.env.get("OPEN_AI_KEY") || "";
}

export function aiModel(){
  return Netlify.env.get("OPENAI_MODEL") || "gpt-5.6-luna";
}
