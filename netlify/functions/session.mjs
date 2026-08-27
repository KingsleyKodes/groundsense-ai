import { blobStore, hash, cleanCode, cleanTeam, json, safeErr, requireSession, listDiscoveries, readJson, deletePrefix, facilitatorPin, assertPin, aiKey, aiModel } from "../shared/lib.mjs";

const PHASES = ["GROUND", "AI", "CONTEXT", "DEBRIEF"];

async function participantState(code, team, session){
  const [discoveries, human, analysis, decision] = await Promise.all([
    listDiscoveries(code, team),
    readJson(`human/${code}/${team}`),
    readJson(`analysis/${code}/${team}`),
    readJson(`decision/${code}/${team}`)
  ]);
  return {
    code, team, phase:session.phase,
    phaseChangedAt:session.phaseChangedAt || session.updatedAt || session.createdAt || new Date().toISOString(),
    runVersion:Number(session.runVersion) || 1,
    discoveries, humanRead:human?.text || "", analysis:analysis || null, decision:decision || null
  };
}

async function adminState(code, session){
  const store = blobStore();
  const [teams, discoveries, humans, analyses, decisions] = await Promise.all([
    store.list({prefix:`teams/${code}/`}),
    store.list({prefix:`discoveries/${code}/`}),
    store.list({prefix:`human/${code}/`}),
    store.list({prefix:`analysis/${code}/`}),
    store.list({prefix:`decision/${code}/`})
  ]);
  const map = new Map();
  const ensure = team => {
    if(!map.has(team)) map.set(team, {team, discovered:0, humanSaved:false, analysed:false, decided:false});
    return map.get(team);
  };
  teams.blobs.forEach(item => ensure(item.key.split("/")[2]));
  discoveries.blobs.forEach(item => { const p=item.key.split("/"); ensure(p[2]).discovered += 1; });
  humans.blobs.forEach(item => ensure(item.key.split("/")[2]).humanSaved = true);
  analyses.blobs.forEach(item => ensure(item.key.split("/")[2]).analysed = true);
  decisions.blobs.forEach(item => ensure(item.key.split("/")[2]).decided = true);
  return {
    code, phase:session.phase,
    phaseChangedAt:session.phaseChangedAt || session.updatedAt || session.createdAt || new Date().toISOString(),
    runVersion:Number(session.runVersion) || 1,
    createdAt:session.createdAt,
    teams:[...map.values()].sort((a,b)=>Number(a.team)-Number(b.team)),
    aiConfigured:Boolean(aiKey()), aiModel:aiModel()
  };
}

export default async function(req){
  try{
    if(req.method === "GET"){
      const url = new URL(req.url);
      const code = cleanCode(url.searchParams.get("code"));
      const session = await requireSession(code);
      const admin = url.searchParams.get("admin") === "1";
      if(admin){
        assertPin(session, facilitatorPin(req));
        return json(await adminState(code, session));
      }
      const team = cleanTeam(url.searchParams.get("team"));
      if(!team) return json({error:"Choose a valid table number from 1 to 30."}, 400);
      return json(await participantState(code, team, session));
    }

    if(req.method === "POST"){
      const body = await req.json();
      const action = String(body.action || "");
      const code = cleanCode(body.code);
      if(!code) return json({error:"Session code is required."}, 400);
      const store = blobStore();

      if(action === "create"){
        const pin = String(body.pin || "");
        if(pin.length < 4 || pin.length > 20) return json({error:"Use a facilitator PIN between 4 and 20 characters."}, 400);
        if(await store.get(`session/${code}`, {type:"json"})) return json({error:"That session code already exists. Open it instead, or choose another code."}, 409);
        const now = new Date().toISOString();
        const session = {code, pinHash:hash(pin), phase:"GROUND", runVersion:1, createdAt:now, phaseChangedAt:now};
        await store.setJSON(`session/${code}`, session);
        return json({ok:true, code, phase:"GROUND", phaseChangedAt:now});
      }

      const session = await requireSession(code);
      assertPin(session, facilitatorPin(req));

      if(action === "phase"){
        const phase = String(body.phase || "").toUpperCase();
        if(!PHASES.includes(phase)) return json({error:"Invalid workshop phase."}, 400);
        const now = new Date().toISOString();
        session.phase = phase;
        session.runVersion = Number(session.runVersion) || 1;
        session.phaseChangedAt = now;
        await store.setJSON(`session/${code}`, session);
        return json({ok:true, phase, phaseChangedAt:now});
      }

      if(action === "reset"){
        const prefixes = ["teams", "discoveries", "human", "analysis", "decision"];
        const counts = await Promise.all(prefixes.map(prefix => deletePrefix(`${prefix}/${code}/`)));
        const now = new Date().toISOString();
        session.phase = "GROUND";
        session.runVersion = (Number(session.runVersion) || 1) + 1;
        session.phaseChangedAt = now;
        await store.setJSON(`session/${code}`, session);
        return json({ok:true, deleted:counts.reduce((a,b)=>a+b,0), phase:"GROUND", phaseChangedAt:now, runVersion:session.runVersion});
      }

      return json({error:"Unknown session action."}, 400);
    }

    return json({error:"Method not allowed."}, 405);
  }catch(error){ return safeErr(error); }
}

export const config = { path:"/api/session" };
