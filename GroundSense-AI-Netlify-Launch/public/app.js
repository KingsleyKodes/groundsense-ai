const $ = (s) => document.querySelector(s);
const state = {
  session: localStorage.getItem("gs_session") || "",
  team: localStorage.getItem("gs_team") || "",
  phase: "GROUND",
  discoveries: [],
  analysis: null,
  timer: null
};

const views = {
  GROUND: $("#phaseGround"),
  AI: $("#phaseAI"),
  CONTEXT: $("#phaseContext"),
  DEBRIEF: $("#phaseDebrief")
};

function esc(s=""){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
async function api(path, options={}) {
  const r = await fetch(path, {
    headers: { "Content-Type":"application/json", ...(options.headers||{}) },
    ...options
  });
  let data = {};
  try { data = await r.json(); } catch {}
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}
function setPhase(phase){
  state.phase = phase;
  Object.entries(views).forEach(([key, el]) => el.classList.toggle("hidden", key !== phase));
  $("#phasePill").textContent = phase;
  $("#phaseTitle").textContent = ({GROUND:"Ground Mode",AI:"AI Mode",CONTEXT:"Human Context",DEBRIEF:"Debrief"})[phase] || phase;
}
function renderDiscoveries(){
  $("#foundCount").textContent = state.discoveries.length;
  $("#groundStat").textContent = state.discoveries.length;
  $("#foundBar").style.width = `${Math.min(100, state.discoveries.length/8*100)}%`;
  $("#signalsList").innerHTML = state.discoveries.map(d => `
    <div class="card signal" style="margin:10px 0;padding:14px 15px">
      <small>${esc(d.source)}</small>
      <strong>${esc(d.text)}</strong>
    </div>`).join("");
}
function renderAnalysis(a){
  if(!a) return;
  state.analysis = a;
  const out = a.result;
  $("#analysisResult").classList.remove("hidden");
  $("#patterns").innerHTML = out.patterns.map(x=>`<li>${esc(x)}</li>`).join("");
  $("#assets").innerHTML = out.assets.map(x=>`<li>${esc(x)}</li>`).join("");
  $("#cautions").innerHTML = out.cautions.map(x=>`<li>${esc(x)}</li>`).join("");
  $("#nextStep").textContent = out.next_step;
  $("#dataLimit").textContent = out.data_limit;
  $("#confidenceNote").textContent = out.confidence_note;
  $("#aiModeBadge").textContent = a.mode === "live-ai" ? "Live AI" : "Workshop fallback";
}
async function refresh(){
  if(!state.session || !state.team) return;
  try{
    const d = await api(`/.netlify/functions/session?code=${encodeURIComponent(state.session)}&team=${encodeURIComponent(state.team)}`);
    $("#connectionBadge").textContent = "● Connected";
    $("#identity").textContent = `Session ${state.session} · Table ${state.team}`;
    state.discoveries = d.discoveries || [];
    renderDiscoveries();
    if(d.analysis) renderAnalysis(d.analysis);
    setPhase(d.phase || "GROUND");
  }catch(e){
    $("#connectionBadge").textContent = "○ Reconnecting";
  }
}
function startPolling(){
  clearInterval(state.timer);
  state.timer = setInterval(refresh, 2500);
  refresh();
}
$("#joinForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const code = $("#sessionCode").value.trim().toUpperCase();
  const team = $("#teamNo").value.trim();
  $("#joinError").textContent = "";
  try{
    await api(`/.netlify/functions/session?code=${encodeURIComponent(code)}&team=${encodeURIComponent(team)}`);
    state.session = code; state.team = team;
    localStorage.setItem("gs_session", code);
    localStorage.setItem("gs_team", team);
    $("#joinView").classList.add("hidden");
    $("#workshopView").classList.remove("hidden");
    $("#humanRead").value = localStorage.getItem(`gs_human_${code}_${team}`) || "";
    startPolling();
  }catch(err){ $("#joinError").textContent = err.message; }
});
$("#discoverForm").addEventListener("submit", async(e)=>{
  e.preventDefault();
  const code = $("#stationCode").value.trim();
  if(!/^\d{4}$/.test(code)){ $("#discoverMessage").textContent="Enter the 4-digit code from the Ground Station."; return; }
  $("#discoverMessage").textContent = "Checking…";
  try{
    const d = await api("/.netlify/functions/discover",{
      method:"POST",
      body:JSON.stringify({session:state.session,team:state.team,stationCode:code})
    });
    $("#discoverMessage").textContent = d.already ? "Your table already has that signal." : "Ground signal added.";
    $("#stationCode").value="";
    await refresh();
  }catch(err){ $("#discoverMessage").textContent=err.message; }
});
$("#saveHumanRead").addEventListener("click", ()=>{
  const v=$("#humanRead").value.trim();
  localStorage.setItem(`gs_human_${state.session}_${state.team}`,v);
  $("#humanSaved").textContent="Saved on this table device ✓";
});
$("#analyseBtn").addEventListener("click", async()=>{
  $("#analyseBtn").disabled=true;
  $("#aiStatus").innerHTML='<span class="loading">Synthesising <i></i><i></i><i></i></span>';
  try{
    const d=await api("/.netlify/functions/analyse",{
      method:"POST",
      body:JSON.stringify({
        session:state.session,
        team:state.team,
        humanRead:$("#humanRead").value.trim()
      })
    });
    renderAnalysis(d);
    $("#aiStatus").textContent="Analysis complete";
  }catch(err){
    $("#aiStatus").textContent=err.message;
  }finally{$("#analyseBtn").disabled=false;}
});
$("#submitAdaptation").addEventListener("click", async()=>{
  const adaptation=$("#adaptation").value.trim();
  if(adaptation.length<5){$("#adaptationStatus").textContent="Add a short table decision first.";return;}
  $("#submitAdaptation").disabled=true;
  try{
    await api("/.netlify/functions/decision",{
      method:"POST",
      body:JSON.stringify({session:state.session,team:state.team,adaptation})
    });
    $("#adaptationStatus").textContent="Human decision submitted ✓";
  }catch(err){$("#adaptationStatus").textContent=err.message;}
  finally{$("#submitAdaptation").disabled=false;}
});

if(state.session && state.team){
  $("#joinView").classList.add("hidden");
  $("#workshopView").classList.remove("hidden");
  $("#humanRead").value = localStorage.getItem(`gs_human_${state.session}_${state.team}`) || "";
  startPolling();
}
