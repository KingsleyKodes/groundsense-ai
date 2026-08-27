import { STATIONS } from "../shared/data.mjs";
import { blobStore, cleanCode, cleanTeam, json, safeErr, requireSession } from "../shared/lib.mjs";

export default async function(req){
  try{
    if(req.method !== "POST") return json({error:"Method not allowed."}, 405);
    const body = await req.json();
    const sessionCode = cleanCode(body.session);
    const team = cleanTeam(body.team);
    const stationCode = String(body.stationCode || "").replace(/\D/g, "").slice(0, 4);
    if(!team) return json({error:"Invalid table number."}, 400);
    const session = await requireSession(sessionCode);
    if(session.phase !== "GROUND") return json({error:"Ground collection has closed. Follow the facilitator's current phase."}, 409);
    const signal = STATIONS.find(item => item.code === stationCode);
    if(!signal) return json({error:"That code does not match a Ground Station. Check the four digits and try again."}, 404);

    const store = blobStore();
    const key = `discoveries/${sessionCode}/${team}/${signal.id}`;
    const existing = await store.get(key);
    if(!existing) await store.setJSON(key, {discoveredAt:new Date().toISOString()});
    return json({
      ok:true,
      already:Boolean(existing),
      signal:{id:signal.id, source:signal.source, text:signal.text}
    });
  }catch(error){ return safeErr(error); }
}

export const config = { path:"/api/discover" };
