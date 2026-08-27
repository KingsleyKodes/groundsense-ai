const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const PHASES = ["GROUND","AI","CONTEXT","DEBRIEF"];
const phaseNames = {GROUND:"Ground",AI:"AI Mode",CONTEXT:"Human Context",DEBRIEF:"Debrief"};

const state = {
  session:"", team:"", phase:"GROUND", discoveries:[], analysis:null, decision:null,
  humanRead:"", humanDirty:false, chosenChange:"", decisionDirty:false, runVersion:1, pollTimer:null, pollBusy:false, joined:false, initialPhaseSeen:false
};
function humanStorageKey(){ return `gs_human_${state.session}_${state.team}_${state.runVersion}`; }

function clearWorkshopUi({clearHuman=true}={}){
  state.discoveries = []; state.analysis = null; state.decision = null; state.chosenChange = ""; state.humanDirty = false; state.decisionDirty = false;
  renderDiscoveries();
  $("#analysisResult").classList.add("hidden");
  $("#patterns").innerHTML = ""; $("#assets").innerHTML = ""; $("#cautions").innerHTML = "";
  $("#nextStep").textContent = ""; $("#dataLimit").textContent = ""; $("#confidenceNote").textContent = "";
  $("#analyseBtn").textContent = "✨ Synthesise the evidence"; $("#aiStatus").textContent = "";
  $("#adaptation").value = ""; $("#decisionStatus").textContent = "";
  $$(".choice").forEach(btn => btn.classList.remove("selected"));
  if(clearHuman){ state.humanRead = ""; $("#humanRead").value = ""; $("#humanSaved").textContent = ""; }
  renderJourney();
}

function applyRunVersion(version){
  const next = Number(version) || 1;
  if(next !== state.runVersion){
    state.runVersion = next;
    clearWorkshopUi({clearHuman:true});
    localStorage.removeItem(humanStorageKey());
    toast("A fresh workshop run has started. Table data was cleared.");
  }else{ state.runVersion = next; }
}

function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

async function api(path, options={}, timeoutMs=9000){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try{
    const response = await fetch(path, {
      ...options,
      signal:controller.signal,
      headers:{...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers || {})}
    });
    let data = {};
    try{ data = await response.json(); }catch{}
    if(!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }catch(error){
    if(error.name === "AbortError") throw new Error("Connection timed out. Please try again.");
    throw error;
  }finally{ clearTimeout(timer); }
}

function setConnection(status){
  const online = status === "online";
  const offline = status === "offline";
  $("#connection").classList.toggle("online", online);
  $("#connection").classList.toggle("offline", offline);
  $("#connectionText").textContent = online ? "Connected" : offline ? "Reconnecting" : "Workshop";
}

let toastTimer;
function toast(message, type="ok"){
  clearTimeout(toastTimer);
  const el = $("#toast");
  el.textContent = message;
  el.classList.toggle("error", type === "error");
  el.classList.remove("hidden");
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

function populateTables(){
  const select = $("#teamNo");
  for(let i=1;i<=30;i++){
    const option = document.createElement("option");
    option.value = String(i); option.textContent = `Table ${i}`;
    select.appendChild(option);
  }
}

function prefillJoin(){
  const params = new URLSearchParams(location.search);
  const querySession = (params.get("session") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,10);
  $("#sessionCode").value = querySession || localStorage.getItem("gs_last_session") || "";
  const lastTeam = localStorage.getItem("gs_last_team") || "";
  if(lastTeam) $("#teamNo").value = lastTeam;
}

function showJoin(){
  stopPolling();
  state.joined = false;
  $("#workshopView").classList.add("hidden");
  $("#joinView").classList.remove("hidden");
  setConnection("idle");
  window.scrollTo({top:0, behavior:"smooth"});
}

function showWorkshop(){
  $("#joinView").classList.add("hidden");
  $("#workshopView").classList.remove("hidden");
  $("#identity").textContent = `SESSION ${state.session} · TABLE ${state.team}`;
}

function renderPhase(phase, announce=true){
  if(!PHASES.includes(phase)) phase = "GROUND";
  const changed = state.phase !== phase;
  state.phase = phase;
  $$(".phase-view").forEach(el => el.classList.add("hidden"));
  const viewIds = {GROUND:"#phaseGround", AI:"#phaseAI", CONTEXT:"#phaseContext", DEBRIEF:"#phaseDebrief"};
  $(viewIds[phase]).classList.remove("hidden");
  $("#phaseTitle").textContent = phaseNames[phase];
  const index = PHASES.indexOf(phase);
  $$(".phase-step").forEach((el, i) => {
    el.classList.toggle("done", i < index);
    el.classList.toggle("current", i === index);
  });
  if(changed && state.initialPhaseSeen && announce){
    toast(`${phaseNames[phase]} is now live.`);
    window.scrollTo({top:0, behavior:"smooth"});
  }
  state.initialPhaseSeen = true;
  if(phase === "DEBRIEF") renderJourney();
}

function renderDiscoveries(){
  const count = state.discoveries.length;
  $("#foundCount").textContent = count;
  $("#groundStat").textContent = count;
  $("#foundBar").style.width = `${Math.min(100, count/8*100)}%`;
  $("#runnerCue").textContent = count === 0 ? "Send your first runner." : count >= 8 ? "You found every Ground Station." : "Swap runner. Find a different station.";
  $("#signalsList").innerHTML = state.discoveries.map((signal, i) => `
    <div class="signal"><div class="signal-index">${i+1}</div><div><small>${escapeHtml(signal.source)}</small><p>${escapeHtml(signal.text)}</p></div></div>
  `).join("");
}

function renderAnalysis(analysis){
  if(!analysis?.result){
    state.analysis = null; $("#analysisResult").classList.add("hidden");
    $("#analyseBtn").textContent = "✨ Synthesise the evidence"; return;
  }
  state.analysis = analysis;
  const out = analysis.result;
  $("#patterns").innerHTML = out.patterns.map(x => `<li>${escapeHtml(x)}</li>`).join("");
  $("#assets").innerHTML = out.assets.map(x => `<li>${escapeHtml(x)}</li>`).join("");
  $("#cautions").innerHTML = out.cautions.map(x => `<li>${escapeHtml(x)}</li>`).join("");
  $("#nextStep").textContent = out.next_step;
  $("#dataLimit").textContent = out.data_limit;
  $("#confidenceNote").textContent = out.confidence_note;
  $("#aiModeBadge").textContent = analysis.mode === "live-ai" ? "● Live AI" : "Prepared backup";
  $("#analysisResult").classList.remove("hidden");
  $("#analyseBtn").textContent = analysis.mode === "live-ai" ? "Synthesis complete ✓" : "Backup synthesis loaded ✓";
}

function renderDecision(decision){
  state.decision = decision || null;
  if(!decision){
    state.chosenChange = ""; $("#adaptation").value = ""; $("#decisionStatus").textContent = "";
    $$(".choice").forEach(btn => btn.classList.remove("selected")); return;
  }
  state.chosenChange = decision.changed || "unsure";
  $("#adaptation").value = decision.adaptation || "";
  $$(".choice").forEach(btn => btn.classList.toggle("selected", btn.dataset.choice === state.chosenChange));
  $("#decisionStatus").textContent = "Final call saved ✓";
}

function renderJourney(){
  const human = state.humanRead.trim();
  $("#journeyHuman").textContent = human || "No hypothesis saved.";
  $("#journeyDecision").textContent = state.decision?.adaptation || "No final decision submitted.";
}

async function refresh(){
  if(!state.joined || state.pollBusy) return;
  state.pollBusy = true;
  try{
    const data = await api(`/api/session?code=${encodeURIComponent(state.session)}&team=${encodeURIComponent(state.team)}`, {}, 7000);
    setConnection("online");
    applyRunVersion(data.runVersion);
    state.discoveries = data.discoveries || [];
    renderDiscoveries();
    if(!state.humanDirty && !document.activeElement?.isSameNode($("#humanRead"))){
      const localHuman = localStorage.getItem(humanStorageKey()) || "";
      state.humanRead = data.humanRead || localHuman;
      $("#humanRead").value = state.humanRead;
    }
    if(data.analysis) renderAnalysis(data.analysis);
    if(data.decision && !state.decisionDirty) renderDecision(data.decision);
    renderPhase(data.phase || "GROUND");
  }catch(error){
    setConnection("offline");
  }finally{
    state.pollBusy = false;
    schedulePoll(document.hidden ? 5000 : 2200);
  }
}

function schedulePoll(delay=2200){
  clearTimeout(state.pollTimer);
  if(state.joined) state.pollTimer = setTimeout(refresh, delay);
}
function startPolling(){ stopPolling(); refresh(); }
function stopPolling(){ clearTimeout(state.pollTimer); state.pollTimer = null; }

$("#joinForm").addEventListener("submit", async event => {
  event.preventDefault();
  const session = $("#sessionCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,10);
  const team = $("#teamNo").value;
  $("#joinError").textContent = "";
  if(!session){ $("#joinError").textContent = "Enter the session code shown by your facilitator."; return; }
  if(!team){ $("#joinError").textContent = "Choose your physical table number."; return; }
  const button = $("#joinBtn"); button.disabled = true; button.textContent = "Joining…";
  try{
    const joined = await api("/api/team", {method:"POST", body:JSON.stringify({action:"join", session, team})});
    state.session = session; state.team = team; state.joined = true; state.initialPhaseSeen = false; state.runVersion = Number(joined.runVersion) || 1;
    clearWorkshopUi({clearHuman:true});
    localStorage.setItem("gs_last_session", session); localStorage.setItem("gs_last_team", team);
    state.humanRead = localStorage.getItem(humanStorageKey()) || ""; state.humanDirty = Boolean(state.humanRead);
    $("#humanRead").value = state.humanRead;
    showWorkshop(); renderPhase(joined.phase || "GROUND", false); startPolling();
  }catch(error){ $("#joinError").textContent = error.message; }
  finally{ button.disabled = false; button.textContent = "Join workshop →"; }
});

$("#changeSession").addEventListener("click", showJoin);
$("#leaveWorkshop").addEventListener("click", () => { localStorage.removeItem(humanStorageKey()); showJoin(); });

$("#stationCode").addEventListener("input", event => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0,4);
  $("#discoverBtn").disabled = event.target.value.length !== 4;
  $("#discoverMessage").textContent = "";
});

$("#discoverForm").addEventListener("submit", async event => {
  event.preventDefault();
  const stationCode = $("#stationCode").value;
  if(!/^\d{4}$/.test(stationCode)) return;
  const button = $("#discoverBtn"); button.disabled = true; button.textContent = "Checking…";
  try{
    const data = await api("/api/discover", {method:"POST", body:JSON.stringify({session:state.session, team:state.team, stationCode})});
    $("#stationCode").value = "";
    $("#discoverMessage").textContent = data.already ? "Your table already brought back this signal." : "Signal added. Send the next runner.";
    toast(data.already ? "Already collected." : "Ground signal added ✓");
    await refresh();
  }catch(error){ $("#discoverMessage").textContent = error.message; toast(error.message, "error"); }
  finally{ button.textContent = "Add this signal"; button.disabled = $("#stationCode").value.length !== 4; }
});

$("#humanRead").addEventListener("input", event => {
  state.humanRead = event.target.value; state.humanDirty = true;
  localStorage.setItem(humanStorageKey(), state.humanRead);
  $("#humanSaved").textContent = "Saved on this device";
});

$("#saveHumanRead").addEventListener("click", async () => {
  const text = $("#humanRead").value.trim();
  if(text.length < 3){ $("#humanSaved").textContent = "Add a short hypothesis first."; return; }
  $("#saveHumanRead").disabled = true;
  try{
    await api("/api/team", {method:"POST", body:JSON.stringify({action:"human", session:state.session, team:state.team, text})});
    state.humanRead = text; state.humanDirty = false; $("#humanSaved").textContent = "Saved to your table ✓"; toast("Working hypothesis saved.");
  }catch(error){ $("#humanSaved").textContent = error.message; }
  finally{ $("#saveHumanRead").disabled = false; }
});

$("#analyseBtn").addEventListener("click", async () => {
  if(state.analysis){ renderAnalysis(state.analysis); return; }
  const button = $("#analyseBtn"); button.disabled = true;
  const status = $("#aiStatus");
  status.innerHTML = '<span class="loading">Connecting sources <i></i><i></i><i></i></span>';
  try{
    const data = await api("/api/analyse", {method:"POST", body:JSON.stringify({session:state.session, team:state.team, humanRead:$("#humanRead").value.trim()})}, 18000);
    renderAnalysis(data); state.humanDirty = false;
    status.textContent = data.mode === "live-ai" ? "Live AI synthesis complete." : "Live AI was unavailable, so the prepared backup was used.";
    toast(data.mode === "live-ai" ? "AI synthesis complete ✓" : "Prepared backup loaded.");
    $("#analysisResult").scrollIntoView({behavior:"smooth", block:"start"});
  }catch(error){ status.textContent = error.message; toast(error.message, "error"); }
  finally{ button.disabled = false; }
});

$$(".choice").forEach(button => button.addEventListener("click", () => {
  state.chosenChange = button.dataset.choice; state.decisionDirty = true;
  $$(".choice").forEach(item => item.classList.toggle("selected", item === button));
}));

$("#adaptation").addEventListener("input", () => { state.decisionDirty = true; });

$("#submitDecision").addEventListener("click", async () => {
  const adaptation = $("#adaptation").value.trim();
  if(!state.chosenChange){ $("#decisionStatus").textContent = "Choose Yes, No or Not sure first."; return; }
  if(adaptation.length < 5){ $("#decisionStatus").textContent = "Add a short final decision first."; return; }
  const button = $("#submitDecision"); button.disabled = true;
  try{
    await api("/api/team", {method:"POST", body:JSON.stringify({action:"decision", session:state.session, team:state.team, changed:state.chosenChange, adaptation})});
    state.decision = {changed:state.chosenChange, adaptation}; state.decisionDirty = false;
    $("#decisionStatus").textContent = "Final call saved ✓"; toast("Human decision saved ✓"); renderJourney();
  }catch(error){ $("#decisionStatus").textContent = error.message; }
  finally{ button.disabled = false; }
});

document.addEventListener("visibilitychange", () => { if(state.joined && !state.pollBusy){ stopPolling(); refresh(); } });

populateTables();
prefillJoin();
setConnection("idle");
