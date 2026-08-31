import { DIGITAL_INPUTS } from "../shared/data.mjs";
import { buildDashboard } from "../shared/synthesis.mjs";
import { blobStore, cleanCode, cleanTeam, json, safeErr, requireSession, listDiscoveries, readJson } from "../shared/lib.mjs";

export default async function(req){
  try{
    if(req.method!=="POST")return json({error:"Method not allowed."},405);

    const body=await req.json();
    const sessionCode=cleanCode(body.session);
    const team=cleanTeam(body.team);
    if(!team)return json({error:"Invalid table number."},400);

    const session=await requireSession(sessionCode);
    if(!["AI","DEBRIEF"].includes(session.phase)){
      return json({error:"AI Mode has not been activated yet."},409);
    }

    const existing=await readJson(`analysis/${sessionCode}/${team}`);
    if(existing?.schemaVersion===7)return json(existing);

    const ground=await listDiscoveries(sessionCode,team);
    const dashboard=buildDashboard(ground.map(item=>item.id));

    const payload={
      schemaVersion:7,
      mode:"workshop-simulation",
      result:dashboard,
      residentCount:ground.length,
      additionalFeedbackCount:DIGITAL_INPUTS.length,
      createdAt:new Date().toISOString()
    };

    await blobStore().setJSON(`analysis/${sessionCode}/${team}`,payload);
    return json(payload);
  }catch(error){
    return safeErr(error);
  }
}

export const config={path:"/api/analyse"};
