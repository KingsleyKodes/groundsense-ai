import { STATIONS } from "./data.mjs";
import { store,cleanCode,cleanTeam,json,requireSession,safeErr } from "./lib.mjs";

export default async function(req){
  try{
    if(req.method!=="POST") return json({error:"Method not allowed."},405);
    const b=await req.json();
    const session=cleanCode(b.session),team=cleanTeam(b.team),stationCode=String(b.stationCode||"").trim();
    if(!team) return json({error:"Invalid table number."},400);
    const s=await requireSession(session);
    if(s.phase!=="GROUND") return json({error:"Ground collection is closed for this round."},409);
    const signal=STATIONS.find(x=>x.code===stationCode);
    if(!signal) return json({error:"That return code does not match a Ground Station."},404);
    const blob=store(),key=`discoveries/${session}/${team}/${signal.id}`;
    const exists=await blob.get(key,{consistency:"strong"});
    if(!exists) await blob.setJSON(key,{at:new Date().toISOString()});
    return json({ok:true,already:Boolean(exists),signal:{id:signal.id,source:signal.source,text:signal.text}});
  }catch(e){return safeErr(e);}
}
