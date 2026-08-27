import OpenAI from "openai";
import { DIGITAL_INPUTS,FALLBACK } from "./data.mjs";
import { store,cleanCode,cleanTeam,json,requireSession,listDiscoveries,getAnalysis,safeErr } from "./lib.mjs";

const schema={
  type:"object",
  additionalProperties:false,
  properties:{
    patterns:{type:"array",items:{type:"string"},minItems:3,maxItems:3},
    assets:{type:"array",items:{type:"string"},minItems:3,maxItems:3},
    cautions:{type:"array",items:{type:"string"},minItems:2,maxItems:2},
    next_step:{type:"string"},
    data_limit:{type:"string"},
    confidence_note:{type:"string"}
  },
  required:["patterns","assets","cautions","next_step","data_limit","confidence_note"]
};

export default async function(req){
  try{
    if(req.method!=="POST") return json({error:"Method not allowed."},405);
    const b=await req.json();
    const session=cleanCode(b.session),team=cleanTeam(b.team);
    if(!team) return json({error:"Invalid table number."},400);
    const s=await requireSession(session);
    if(!["AI","CONTEXT","DEBRIEF"].includes(s.phase)) return json({error:"AI Mode has not been activated yet."},409);

    const existing=await getAnalysis(session,team);
    if(existing) return json(existing);

    const ground=await listDiscoveries(session,team);
    let mode="workshop-fallback",result=FALLBACK;
    const key=process.env.OPENAI_API_KEY;

    if(key){
      try{
        const client=new OpenAI({apiKey:key});
        const response=await client.responses.create({
          model:process.env.OPENAI_MODEL||"gpt-5",
          store:false,
          instructions:`You are an AI copilot supporting grassroots community leaders in a short training simulation.
Analyse only the supplied fictional information. Do not invent resident facts, percentages, causes or certainty.
Separate observed patterns from interpretation. Treat repetition across channels as suggestive, not proof.
Your role is decision support, not decision-making. The final recommendation must remain a testable next step, not a definitive answer.
Use concise British English suitable for a Singapore grassroots leadership workshop.`,
          input:JSON.stringify({
            mission:"Understand why residents are not participating and recommend a practical next step.",
            table_human_working_hypothesis:String(b.humanRead||"").slice(0,700),
            ground_signals_collected_by_table:ground,
            digital_inputs_already_collected_through_existing_channels:DIGITAL_INPUTS
          }),
          text:{
            format:{
              type:"json_schema",
              name:"grassroots_synthesis",
              strict:true,
              schema
            }
          }
        });
        result=JSON.parse(response.output_text);
        mode="live-ai";
      }catch(err){
        console.error("OpenAI analysis failed; using workshop fallback",err);
      }
    }

    const payload={mode,result,groundCount:ground.length,digitalCount:DIGITAL_INPUTS.length,createdAt:new Date().toISOString()};
    await store().setJSON(`analysis/${session}/${team}`,payload);
    return json(payload);
  }catch(e){return safeErr(e);}
}
