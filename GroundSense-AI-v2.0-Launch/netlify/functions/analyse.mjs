import { DIGITAL_INPUTS, FALLBACK } from "../shared/data.mjs";
import { blobStore, cleanCode, cleanTeam, cleanText, json, safeErr, requireSession, listDiscoveries, readJson, aiKey, aiModel } from "../shared/lib.mjs";

const schema = {
  type:"object",
  additionalProperties:false,
  properties:{
    patterns:{type:"array", minItems:3, maxItems:3, items:{type:"string"}},
    assets:{type:"array", minItems:3, maxItems:3, items:{type:"string"}},
    cautions:{type:"array", minItems:2, maxItems:2, items:{type:"string"}},
    next_step:{type:"string"},
    data_limit:{type:"string"},
    confidence_note:{type:"string"}
  },
  required:["patterns","assets","cautions","next_step","data_limit","confidence_note"]
};

function extractOutputText(response){
  for(const item of response?.output || []){
    if(item?.type !== "message") continue;
    for(const part of item.content || []){
      if(part?.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function validResult(value){
  if(!value || typeof value !== "object") return false;
  if(!Array.isArray(value.patterns) || value.patterns.length !== 3) return false;
  if(!Array.isArray(value.assets) || value.assets.length !== 3) return false;
  if(!Array.isArray(value.cautions) || value.cautions.length !== 2) return false;
  return [value.next_step, value.data_limit, value.confidence_note].every(v => typeof v === "string" && v.length > 0);
}

async function callOpenAI(model, key, evidence){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try{
    const response = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      signal:controller.signal,
      headers:{
        "Authorization":`Bearer ${key}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model,
        store:false,
        max_output_tokens:1200,
        instructions:`You are an AI copilot supporting grassroots community leaders in a short training simulation. Analyse only the fictional evidence supplied. Do not invent facts, percentages, motives or certainty. Distinguish patterns from proof. Treat repeated signals as suggestive rather than definitive. Surface community assets as well as problems. Your role is decision support, not decision-making. Recommend one small, testable next step. Explicitly state the limitation that uncaptured human context may change the interpretation. Use concise British English. Keep each list item under 18 words.`,
        input:JSON.stringify(evidence),
        text:{
          verbosity:"low",
          format:{type:"json_schema", name:"groundsense_synthesis", strict:true, schema}
        }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if(!response.ok){
      const error = new Error(payload?.error?.message || `OpenAI request failed (${response.status}).`);
      error.httpStatus = response.status;
      throw error;
    }
    const text = extractOutputText(payload);
    if(!text) throw new Error("OpenAI returned no text output.");
    const parsed = JSON.parse(text);
    if(!validResult(parsed)) throw new Error("OpenAI returned an unexpected result shape.");
    return parsed;
  }finally{
    clearTimeout(timer);
  }
}

export default async function(req){
  try{
    if(req.method !== "POST") return json({error:"Method not allowed."}, 405);
    const body = await req.json();
    const sessionCode = cleanCode(body.session);
    const team = cleanTeam(body.team);
    if(!team) return json({error:"Invalid table number."}, 400);
    const session = await requireSession(sessionCode);
    if(!["AI","CONTEXT","DEBRIEF"].includes(session.phase)) return json({error:"AI Mode has not been activated yet."}, 409);

    const existing = await readJson(`analysis/${sessionCode}/${team}`);
    if(existing) return json(existing);

    const store = blobStore();
    const humanRead = cleanText(body.humanRead, 900);
    if(humanRead.length >= 3){
      await store.setJSON(`human/${sessionCode}/${team}`, {text:humanRead, savedAt:new Date().toISOString()});
    }

    const ground = await listDiscoveries(sessionCode, team);
    const evidence = {
      mission:"Understand why residents may not be participating and identify a practical next step.",
      ground_signals_collected_by_the_table:ground,
      digital_inputs_received_from_connected_channels:DIGITAL_INPUTS
    };

    let mode = "prepared-backup";
    let result = FALLBACK;
    let modelUsed = null;
    const key = aiKey();
    const preferred = aiModel();

    if(key){
      const models = [...new Set([preferred, "gpt-5"])];
      for(const model of models){
        try{
          result = await callOpenAI(model, key, evidence);
          mode = "live-ai";
          modelUsed = model;
          break;
        }catch(error){
          console.error(`OpenAI analysis failed with ${model}:`, error);
          const shouldRetryModel = [400, 404].includes(error?.httpStatus);
          if(!shouldRetryModel) break;
        }
      }
    }

    const payload = {
      mode, result, modelUsed,
      groundCount:ground.length,
      digitalCount:DIGITAL_INPUTS.length,
      createdAt:new Date().toISOString()
    };
    await store.setJSON(`analysis/${sessionCode}/${team}`, payload);
    return json(payload);
  }catch(error){ return safeErr(error); }
}

export const config = { path:"/api/analyse" };
