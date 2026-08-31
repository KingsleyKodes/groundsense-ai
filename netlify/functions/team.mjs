import { blobStore, cleanCode, cleanTeam, json, safeErr, requireSession } from "../shared/lib.mjs";

export default async function(req){
  try{
    if(req.method!=="POST")return json({error:"Method not allowed."},405);
    const body=await req.json();
    const action=String(body.action||"");
    const code=cleanCode(body.session||body.code);
    const team=cleanTeam(body.team);
    if(!team)return json({error:"Choose a valid table number from 1 to 30."},400);
    const session=await requireSession(code);
    if(action!=="join")return json({error:"Unknown table action."},400);

    const store=blobStore();
    const key=`teams/${code}/${team}`;
    const existing=await store.get(key,{type:"json"});
    if(!existing)await store.setJSON(key,{joinedAt:new Date().toISOString()});

    return json({
      ok:true,
      phase:session.phase,
      phaseChangedAt:session.phaseChangedAt||session.createdAt||new Date().toISOString(),
      runVersion:Number(session.runVersion)||1
    });
  }catch(error){return safeErr(error);}
}

export const config={path:"/api/team"};
