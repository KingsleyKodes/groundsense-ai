const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const PHASES = ["GROUND","AI","DEBRIEF"];
const phaseNames = {GROUND:"Gather",AI:"AI",DEBRIEF:"Debrief"};

const state = {
  session:"", team:"", phase:"GROUND", discoveries:[], analysis:null, activeDetail:null,
  runVersion:1, pollTimer:null, pollBusy:false, joined:false, initialPhaseSeen:false
};

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
    let data={}; try{data=await response.json();}catch{}
    if(!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }catch(error){
    if(error.name==="AbortError") throw new Error("Connection timed out. Please try again.");
    throw error;
  }finally{ clearTimeout(timer); }
}

function setConnection(status){
  const online=status==="online", offline=status==="offline";
  $("#connection").classList.toggle("online",online);
  $("#connection").classList.toggle("offline",offline);
  $("#connectionText").textContent=online?"Connected":offline?"Reconnecting":"Workshop";
}

let toastTimer;
function toast(message,type="ok"){
  clearTimeout(toastTimer);
  const el=$("#toast");
  el.textContent=message;
  el.classList.toggle("error",type==="error");
  el.classList.remove("hidden");
  toastTimer=setTimeout(()=>el.classList.add("hidden"),2400);
}

function populateTables(){
  const select=$("#teamNo");
  for(let i=1;i<=30;i++){
    const option=document.createElement("option");
    option.value=String(i); option.textContent=`Table ${i}`;
    select.appendChild(option);
  }
}

function prefillJoin(){
  const params=new URLSearchParams(location.search);
  const querySession=(params.get("session")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);
  $("#sessionCode").value=querySession||localStorage.getItem("gs_last_session")||"";
  const lastTeam=localStorage.getItem("gs_last_team")||"";
  if(lastTeam) $("#teamNo").value=lastTeam;
}

function clearWorkshopUi(){
  state.discoveries=[]; state.analysis=null;
  renderDiscoveries();
  $("#analysisResult").classList.add("hidden");
  $("#insightHeadline").textContent="";
  $("#supportingPoints").innerHTML="";
  $("#themeBars").innerHTML="";
  $("#coverageCount").textContent="0";
  $("#coverageLabel").textContent="—";
  $("#coverageNote").textContent="";
  $("#whatWorked").textContent="";
  $("#needsAttention").textContent="";
  $("#recommendedAction").textContent="";
  state.activeDetail=null;
  $("#detailEyebrow").textContent="Explore the dashboard";
  $("#detailTitle").textContent="Tap a theme to see more";
  $("#detailBadge").textContent="Interactive";
  $("#detailSummary").textContent="Select Resident voices, Feedback mix, or any theme bar above.";
  $("#detailBody").innerHTML="";
  $("#mixValue").textContent="50%";
  $("#mixLabel").textContent="Mixed feedback";
  $("#mixRing").style.setProperty("--praise","50");
  $("#analyseBtn").textContent="✨ Analyse the feedback";
  $("#aiStatus").textContent="";
}

function applyRunVersion(version){
  const next=Number(version)||1;
  if(next!==state.runVersion){
    state.runVersion=next;
    clearWorkshopUi();
    toast("A fresh workshop run has started.");
  }else state.runVersion=next;
}

function showJoin(){
  stopPolling();
  state.joined=false;
  $("#workshopView").classList.add("hidden");
  $("#joinView").classList.remove("hidden");
  setConnection("idle");
  window.scrollTo({top:0,behavior:"smooth"});
}

function showWorkshop(){
  $("#joinView").classList.add("hidden");
  $("#workshopView").classList.remove("hidden");
  $("#identity").textContent=`SESSION ${state.session} · TABLE ${state.team}`;
}

function renderPhase(phase,announce=true){
  if(!PHASES.includes(phase)) phase="GROUND";
  const changed=state.phase!==phase;
  state.phase=phase;
  $$(".phase-view").forEach(el=>el.classList.add("hidden"));
  const ids={GROUND:"#phaseGround",AI:"#phaseAI",DEBRIEF:"#phaseDebrief"};
  $(ids[phase]).classList.remove("hidden");
  $("#phaseTitle").textContent=phaseNames[phase];
  const index=PHASES.indexOf(phase);
  $$(".phase-step").forEach((el,i)=>{
    el.classList.toggle("done",i<index);
    el.classList.toggle("current",i===index);
  });
  if(changed&&state.initialPhaseSeen&&announce){
    toast(`${phaseNames[phase]} is now live.`);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  state.initialPhaseSeen=true;
}

function renderDiscoveries(){
  const count=state.discoveries.length;
  $("#foundCount").textContent=count;
  $("#groundStat").textContent=count;
  $("#foundBar").style.width=`${Math.min(100,count/8*100)}%`;
  $("#runnerCue").textContent=count===0?"Visit 8 different resident profiles.":count>=8?"All 8 collected ✓":`${8-count} more to enter.`;
  $("#signalsList").innerHTML=state.discoveries.map(signal=>`
    <span class="signal-chip">✓ ${escapeHtml(signal.source)}</span>
  `).join("");
}


function chips(items=[],kind="captured"){
  if(!items.length)return '<span class="empty-chip">None</span>';
  return items.map(item=>`<span class="detail-chip ${kind}">${escapeHtml(item)}</span>`).join("");
}

function setActiveTrigger(key){
  document.querySelectorAll(".dashboard-trigger,.interactive-theme").forEach(el=>{
    el.classList.toggle("selected",el.dataset.detail===key||el.dataset.theme===key);
  });
}

function showDashboardDetail(kind,key=null){
  const out=state.analysis?.result;
  if(!out)return;
  const interactive=out.interactive||{};

  if(kind==="voices"){
    const data=interactive.voices||{captured:state.discoveries.map(x=>x.source),missing:[],note:out.coverageNote||""};
    $("#detailEyebrow").textContent="Resident voices";
    $("#detailTitle").textContent=`${data.captured?.length||0} of 8 profiles captured`;
    $("#detailBadge").textContent=out.coverage?.label||"Coverage";
    $("#detailSummary").textContent=data.note||out.coverageNote||"";
    $("#detailBody").innerHTML=`
      <div class="detail-section"><strong>Captured</strong><div class="detail-chips">${chips(data.captured||[],"captured")}</div></div>
      <div class="detail-section"><strong>Missing voices</strong><div class="detail-chips">${chips(data.missing||[],"missing")}</div></div>`;
    state.activeDetail="voices";setActiveTrigger("voices");return;
  }

  if(kind==="mix"){
    const data=interactive.mix||{};
    const praise=Number(data.positive??out.feedbackMix?.positive??50);
    const improve=Number(data.improvement??(100-praise));
    $("#detailEyebrow").textContent="Feedback mix";
    $("#detailTitle").textContent=`${praise}% praise · ${improve}% improvement`;
    $("#detailBadge").textContent=data.label||out.feedbackMix?.label||"Mixed";
    $("#detailSummary").textContent=data.note||"This is an indicative coded balance across feedback themes, not a satisfaction percentage.";
    $("#detailBody").innerHTML=`
      <div class="detail-two-col">
        <div><span class="mini-label">Strongest positive</span><strong>${escapeHtml(data.strongestPositive||out.topPositive?.label||"—")}</strong></div>
        <div><span class="mini-label">Strongest improvement</span><strong>${escapeHtml(data.strongestImprovement||out.topFriction?.label||"—")}</strong></div>
      </div>`;
    state.activeDetail="mix";setActiveTrigger("mix");return;
  }

  if(kind==="theme"&&key){
    const data=interactive.themes?.[key]||(out.topThemes||[]).find(t=>t.key===key);
    if(!data)return;
    const residentCount=(data.residentSources||[]).length;
    $("#detailEyebrow").textContent="Theme deep dive";
    $("#detailTitle").textContent=data.label||"Theme";
    $("#detailBadge").textContent=data.emphasis==="positive"?"Strength":data.emphasis==="improve"?"Needs attention":"Mixed";
    $("#detailSummary").textContent=data.interpretation||"This theme appears across the captured feedback.";
    $("#detailBody").innerHTML=`
      <div class="evidence-line"><span class="evidence-number">${residentCount}</span><span>captured resident ${residentCount===1?"voice":"voices"} mention this theme</span></div>
      <div class="evidence-line"><span class="evidence-number">${Number(data.broaderCount)||0}</span><span>additional post-event feedback items also point here</span></div>
      ${(data.residentSources||[]).length?`<div class="detail-section"><strong>Resident profiles</strong><div class="detail-chips">${chips(data.residentSources,"captured")}</div></div>`:""}
      <div class="detail-action"><span>Next move</span><p>${escapeHtml(data.action||"Use this theme to guide the next improvement.")}</p></div>`;
    state.activeDetail=key;setActiveTrigger(key);
  }
}

function renderAnalysis(analysis){
  if(!analysis?.result){
    state.analysis=null;
    $("#analysisResult").classList.add("hidden");
    $("#analyseBtn").textContent="✨ Analyse the feedback";
    return;
  }

  state.analysis=analysis;
  const out=analysis.result;

  $("#coverageCount").textContent=out.coverage?.captured ?? 0;
  $("#coverageLabel").textContent=out.coverage?.label || "—";

  const praise=Number(out.feedbackMix?.positive ?? 50);
  $("#mixValue").textContent=`${praise}%`;
  $("#mixLabel").textContent=out.feedbackMix?.label || "Mixed feedback";
  $("#mixRing").style.setProperty("--praise",String(praise));

  $("#themeBars").innerHTML=(out.topThemes||[]).slice(0,4).map(theme=>`
    <button class="theme-row interactive-theme" type="button" data-theme="${escapeHtml(theme.key)}" aria-label="Explore ${escapeHtml(theme.label)}">
      <div class="theme-name">${escapeHtml(theme.label)} <span class="theme-arrow">›</span></div>
      <div class="theme-track"><span style="width:${Math.max(0,Math.min(100,Number(theme.percent)||0))}%"></span></div>
    </button>
  `).join("");

  $("#insightHeadline").textContent=out.headline || "Family Day feedback shows a mix of strengths and improvement areas.";
  $("#coverageNote").textContent=out.coverageNote || "";
  $("#whatWorked").textContent=out.whatWorked || "Residents identified clear strengths worth keeping.";
  $("#needsAttention").textContent=out.needsAttention || "The feedback points to an area that can be improved.";
  $("#recommendedAction").textContent=out.recommendedAction || "Keep what worked and address the strongest repeated friction point.";
  $("#supportingPoints").innerHTML=(out.supporting||[]).slice(0,2).map((point,i)=>`
    <div class="support-point"><span>${i+1}</span><p>${escapeHtml(point)}</p></div>
  `).join("");

  $("#aiModeBadge").textContent="Workshop synthesis";
  $("#analysisResult").classList.remove("hidden");
  $("#analyseBtn").textContent="Dashboard ready ✓";

  const firstTheme=(out.topThemes||[])[0]?.key;
  if(state.activeDetail==="voices")showDashboardDetail("voices");
  else if(state.activeDetail==="mix")showDashboardDetail("mix");
  else if(state.activeDetail&&out.interactive?.themes?.[state.activeDetail])showDashboardDetail("theme",state.activeDetail);
  else if(firstTheme)showDashboardDetail("theme",firstTheme);
}

async function refresh(){
  if(!state.joined||state.pollBusy)return;
  state.pollBusy=true;
  try{
    const data=await api(`/api/session?code=${encodeURIComponent(state.session)}&team=${encodeURIComponent(state.team)}`,{},7000);
    setConnection("online");
    applyRunVersion(data.runVersion);
    state.discoveries=data.discoveries||[];
    renderDiscoveries();
    if(data.analysis) renderAnalysis(data.analysis);
    renderPhase(data.phase||"GROUND");
  }catch{
    setConnection("offline");
  }finally{
    state.pollBusy=false;
    schedulePoll(document.hidden?5000:2200);
  }
}

function schedulePoll(delay=2200){
  clearTimeout(state.pollTimer);
  if(state.joined) state.pollTimer=setTimeout(refresh,delay);
}
function startPolling(){stopPolling();refresh();}
function stopPolling(){clearTimeout(state.pollTimer);state.pollTimer=null;}

$("#joinForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const session=$("#sessionCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);
  const team=$("#teamNo").value;
  $("#joinError").textContent="";
  if(!session){$("#joinError").textContent="Enter the session code.";return;}
  if(!team){$("#joinError").textContent="Choose your table.";return;}
  const button=$("#joinBtn");button.disabled=true;button.textContent="Joining…";
  try{
    const joined=await api("/api/team",{method:"POST",body:JSON.stringify({action:"join",session,team})});
    state.session=session;state.team=team;state.joined=true;state.initialPhaseSeen=false;state.runVersion=Number(joined.runVersion)||1;
    clearWorkshopUi();
    localStorage.setItem("gs_last_session",session);
    localStorage.setItem("gs_last_team",team);
    showWorkshop();
    renderPhase(joined.phase||"GROUND",false);
    startPolling();
  }catch(error){
    $("#joinError").textContent=error.message;
  }finally{
    button.disabled=false;button.textContent="Join workshop →";
  }
});

$("#changeSession").addEventListener("click",showJoin);
$("#leaveWorkshop").addEventListener("click",showJoin);

$("#stationCode").addEventListener("input",event=>{
  event.target.value=event.target.value.replace(/\D/g,"").slice(0,4);
  $("#discoverBtn").disabled=event.target.value.length!==4;
  $("#discoverMessage").textContent="";
});

$("#discoverForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const stationCode=$("#stationCode").value;
  if(!/^\d{4}$/.test(stationCode))return;
  const button=$("#discoverBtn");button.disabled=true;button.textContent="Checking…";
  try{
    const data=await api("/api/discover",{method:"POST",body:JSON.stringify({session:state.session,team:state.team,stationCode})});
    $("#stationCode").value="";
    $("#discoverMessage").textContent=data.already?"Already collected.":"Comment added ✓";
    toast(data.already?"Already collected.":"Comment added ✓");
    await refresh();
  }catch(error){
    $("#discoverMessage").textContent=error.message;
    toast(error.message,"error");
  }finally{
    button.textContent="Add comment";
    button.disabled=$("#stationCode").value.length!==4;
  }
});

$("#analyseBtn").addEventListener("click",async()=>{
  if(state.analysis){renderAnalysis(state.analysis);return;}
  const button=$("#analyseBtn"),status=$("#aiStatus");
  button.disabled=true;
  const steps=["Bringing Family Day feedback together","Finding patterns","Building synthesis"];
  let step=0;
  const show=()=>{status.innerHTML=`<span class="loading">${steps[step]} <i></i><i></i><i></i></span>`;};
  show();
  const interval=setInterval(()=>{step=Math.min(step+1,steps.length-1);show();},650);
  try{
    const request=api("/api/analyse",{method:"POST",body:JSON.stringify({session:state.session,team:state.team})},9000);
    const [data]=await Promise.all([request,new Promise(resolve=>setTimeout(resolve,2200))]);
    renderAnalysis(data);
    status.textContent="Dashboard ready.";
    toast("Dashboard ready ✓");
    $("#analysisResult").scrollIntoView({behavior:"smooth",block:"start"});
  }catch{
    status.textContent="Could not load. Tap again.";
    toast("Please try again.","error");
  }finally{
    clearInterval(interval);
    button.disabled=false;
  }
});


$("#coverageTrigger").addEventListener("click",()=>showDashboardDetail("voices"));
$("#mixTrigger").addEventListener("click",()=>showDashboardDetail("mix"));
$("#themeBars").addEventListener("click",event=>{
  const button=event.target.closest(".interactive-theme");
  if(button)showDashboardDetail("theme",button.dataset.theme);
});

document.addEventListener("visibilitychange",()=>{if(state.joined&&!state.pollBusy){stopPolling();refresh();}});

populateTables();
prefillJoin();
setConnection("idle");
