import { blobStore, cleanCode, cleanTeam, cleanText, json, safeErr, requireSession } from "../shared/lib.mjs";

export default async function(req){
  try{
    if(req.method !== "POST") return json({error:"Method not allowed."}, 405);
    const body = await req.json();
    const action = String(body.action || "");
    const code = cleanCode(body.session || body.code);
    const team = cleanTeam(body.team);
    if(!team) return json({error:"Choose a valid table number from 1 to 30."}, 400);
    const session = await requireSession(code);
    const store = blobStore();

    if(action === "join"){
      const key = `teams/${code}/${team}`;
      const existing = await store.get(key, {type:"json"});
      if(!existing) await store.setJSON(key, {joinedAt:new Date().toISOString()});
      return json({ok:true, phase:session.phase,
        phaseChangedAt:session.phaseChangedAt || session.updatedAt || session.createdAt || new Date().toISOString(),
        runVersion:Number(session.runVersion) || 1});
    }

    if(action === "human"){
      const text = cleanText(body.text, 900);
      if(text.length < 3) return json({error:"Add a short working hypothesis first."}, 400);
      await store.setJSON(`human/${code}/${team}`, {text, savedAt:new Date().toISOString()});
      return json({ok:true});
    }

    if(action === "decision"){
      if(!["CONTEXT","DEBRIEF"].includes(session.phase)) return json({error:"Human Context is not open yet."}, 409);
      const changed = ["yes","no","unsure"].includes(body.changed) ? body.changed : "unsure";
      const adaptation = cleanText(body.adaptation, 1200);
      if(adaptation.length < 5) return json({error:"Add a short final decision first."}, 400);
      await store.setJSON(`decision/${code}/${team}`, {changed, adaptation, savedAt:new Date().toISOString()});
      return json({ok:true});
    }

    return json({error:"Unknown table action."}, 400);
  }catch(error){ return safeErr(error); }
}

export const config = { path:"/api/team" };
