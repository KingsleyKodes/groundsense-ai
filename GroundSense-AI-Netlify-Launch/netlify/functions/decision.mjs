import { store,cleanCode,cleanTeam,json,requireSession,safeErr } from "./lib.mjs";
export default async function(req){
  try{
    if(req.method!=="POST") return json({error:"Method not allowed."},405);
    const b=await req.json();
    const session=cleanCode(b.session),team=cleanTeam(b.team),adaptation=String(b.adaptation||"").trim().slice(0,1200);
    if(!team||adaptation.length<5) return json({error:"A table number and short decision are required."},400);
    const s=await requireSession(session);
    if(!["CONTEXT","DEBRIEF"].includes(s.phase)) return json({error:"Human Context is not open yet."},409);
    await store().setJSON(`decision/${session}/${team}`,{adaptation,at:new Date().toISOString()});
    return json({ok:true});
  }catch(e){return safeErr(e);}
}
