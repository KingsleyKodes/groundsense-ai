import { store,hash,cleanCode,cleanTeam,json,getSession,requireSession,listDiscoveries,getAnalysis,getDecision,safeErr } from "./lib.mjs";

export default async function(req){
  try{
    if(req.method==="GET"){
      const u=new URL(req.url);
      const code=cleanCode(u.searchParams.get("code"));
      const team=cleanTeam(u.searchParams.get("team"));
      const admin=u.searchParams.get("admin")==="1";
      const s=await requireSession(code);
      if(admin){
        const pin=u.searchParams.get("pin")||"";
        if(hash(pin)!==s.pinHash) return json({error:"Incorrect facilitator PIN."},403);
        const blob=store();
        const [d,a,dec]=await Promise.all([
          blob.list({prefix:`discoveries/${code}/`}),
          blob.list({prefix:`analysis/${code}/`}),
          blob.list({prefix:`decision/${code}/`})
        ]);
        const map=new Map();
        for(const b of d.blobs){
          const parts=b.key.split("/"); const t=parts[2];
          if(!map.has(t)) map.set(t,{team:t,discovered:0,analysed:false,decided:false});
          map.get(t).discovered++;
        }
        for(const b of a.blobs){
          const t=b.key.split("/")[2];
          if(!map.has(t)) map.set(t,{team:t,discovered:0,analysed:false,decided:false});
          map.get(t).analysed=true;
        }
        for(const b of dec.blobs){
          const t=b.key.split("/")[2];
          if(!map.has(t)) map.set(t,{team:t,discovered:0,analysed:false,decided:false});
          map.get(t).decided=true;
        }
        return json({code,phase:s.phase,teams:[...map.values()].sort((x,y)=>Number(x.team)-Number(y.team))});
      }
      if(!team) return json({error:"Enter a valid table number from 1 to 30."},400);
      const [discoveries,analysis,decision]=await Promise.all([
        listDiscoveries(code,team),getAnalysis(code,team),getDecision(code,team)
      ]);
      return json({code,team,phase:s.phase,discoveries,analysis,decision});
    }

    if(req.method==="POST"){
      const body=await req.json();
      const action=body.action;
      const code=cleanCode(body.code);
      if(!code) return json({error:"Session code is required."},400);
      const blob=store();

      if(action==="create"){
        const pin=String(body.pin||"");
        if(pin.length<4) return json({error:"PIN must be at least 4 characters."},400);
        if(await getSession(code)) return json({error:"That session code already exists. Use Open existing."},409);
        const data={code,pinHash:hash(pin),phase:"GROUND",createdAt:new Date().toISOString()};
        await blob.setJSON(`session/${code}`,data);
        return json({ok:true,code,phase:"GROUND"});
      }

      const s=await requireSession(code);
      if(hash(String(body.pin||""))!==s.pinHash) return json({error:"Incorrect facilitator PIN."},403);

      if(action==="phase"){
        const phase=String(body.phase||"").toUpperCase();
        if(!["GROUND","AI","CONTEXT","DEBRIEF"].includes(phase)) return json({error:"Invalid phase."},400);
        s.phase=phase;s.updatedAt=new Date().toISOString();
        await blob.setJSON(`session/${code}`,s);
        return json({ok:true,phase});
      }
      return json({error:"Unknown action."},400);
    }
    return json({error:"Method not allowed."},405);
  }catch(e){return safeErr(e);}
}
