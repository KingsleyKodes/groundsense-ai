const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const PHASES = ["GROUND","AI","CONTEXT","DEBRIEF"];
const names = {GROUND:"Ground",AI:"AI Mode",CONTEXT:"Human Context",DEBRIEF:"Debrief"};
const suggested = {GROUND:180,AI:180,CONTEXT:120,DEBRIEF:180};
const cues = {
  GROUND:{title:"Send one runner at a time.", say:"“The information is out there. Go find it. One person leaves your table at a time.”", do:"Start the physical collection round. Encourage tables to swap runners each trip.", watch:"Do not let tables dispatch all eight people at once. The friction is intentional."},
  AI:{title:"Connect the digital channels.", say:"“Now imagine your grassroots process is connected. AI can work across information those channels have already captured.”", do:"Ask tables to tap Synthesise the evidence and compare the output with their first hypothesis.", watch:"Do not say AI magically gathers data. It receives information through connected touchpoints."},
  CONTEXT:{title:"Send one representative forward.", say:"“There is one thing the system was never given. Send one person forward, then decide again.”", do:"Reveal the Final Ground Update only to the representatives and send them back to their tables.", watch:"Give tables enough time to discuss how the human context changes their approach."},
  DEBRIEF:{title:"Same community. More context. Better decision.", say:"“AI can reduce the distance between information and action. It does not replace knowing the ground.”", do:"Ask what AI surfaced, what it missed, and what the GRL still had to decide.", watch:"Land the point on judgement and relationships, not on AI versus humans."}
};
let state = {session:"", pin:"", phase:"GROUND", phaseChangedAt:null, teams:[], poll:null, busy:false, timer:null};

async function api(path, options={}, timeoutMs=9000){
  const controller = new AbortController(); const timer=setTimeout(()=>controller.abort(), timeoutMs);
  try{
    const response = await fetch(path, {...options, signal:controller.signal, headers:{...(options.body?{"Content-Type":"application/json"}:{}), ...(options.headers||{})}});
    let data={}; try{data=await response.json();}catch{}
    if(!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }catch(error){ if(error.name === "AbortError") throw new Error("Connection timed out. Try again."); throw error; }
  finally{clearTimeout(timer);}
}
function adminHeaders(){ return {"x-facilitator-pin":state.pin}; }
let toastTimer;
function toast(message,type="ok"){clearTimeout(toastTimer);const el=$("#fToast");el.textContent=message;el.classList.toggle("error",type==="error");el.classList.remove("hidden");toastTimer=setTimeout(()=>el.classList.add("hidden"),2600);}
function generateCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let out="";crypto.getRandomValues(new Uint32Array(4)).forEach(n=>out+=chars[n%chars.length]);return out;}
function phaseIndex(){return PHASES.indexOf(state.phase);}
function renderPhase(){
  const i=phaseIndex(); $("#fPhase").textContent=names[state.phase];
  $$("[data-fstep]").forEach((el,idx)=>{el.classList.toggle("done",idx<i);el.classList.toggle("current",idx===i);});
  const next=PHASES[i+1]; $("#advancePhase").disabled=!next; $("#advancePhase").textContent=next?`Advance to ${names[next]} →`:"Workshop complete ✓";
  $("#backPhase").disabled=i<=0;
  const cue=cues[state.phase]; $("#cueTitle").textContent=cue.title; $("#cueSay").textContent=cue.say; $("#cueDo").textContent=cue.do; $("#cueWatch").textContent=cue.watch;
  $("#suggestedTime").textContent=`Suggested: ${formatTime(suggested[state.phase])}`;
  renderTimer();
}
function formatTime(seconds){const m=Math.floor(seconds/60),s=seconds%60;return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
function renderTimer(){
  if(!state.phaseChangedAt) return;
  const elapsed=Math.max(0,Math.floor((Date.now()-new Date(state.phaseChangedAt).getTime())/1000));
  $("#phaseTimer").textContent=formatTime(elapsed); $("#phaseTimer").classList.toggle("over",elapsed>suggested[state.phase]);
}
function renderTables(){
  $("#joinedCount").textContent=state.teams.length;
  $("#tableList").innerHTML=state.teams.length?state.teams.map(t=>`
    <div class="table-row"><div class="table-name">Table ${t.team}</div><div class="signals"><div class="small strong">${t.discovered}/8 ground</div><div class="mini-progress"><span style="width:${Math.min(100,t.discovered/8*100)}%"></span></div></div><div class="human ${t.humanSaved?"ok":"pending"}">${t.humanSaved?"Hypothesis ✓":"Hypothesis —"}</div><div class="${t.analysed?"ok":"pending"}">${t.analysed?"AI ✓":"AI —"}</div><div class="${t.decided?"ok":"pending"}">${t.decided?"Decision ✓":"Decision —"}</div></div>
  `).join(""):'<p class="muted">Waiting for tables to join…</p>';
}
async function load(){
  if(!state.session||state.busy)return;state.busy=true;
  try{
    const d=await api(`/api/session?code=${encodeURIComponent(state.session)}&admin=1`,{headers:adminHeaders()},7000);
    state.phase=d.phase;state.phaseChangedAt=d.phaseChangedAt;state.teams=d.teams||[];
    $("#lastUpdated").textContent=`Updated ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
    $("#aiReadyBadge").textContent=d.aiConfigured?`● AI key configured · ${d.aiModel}`:"⚠ AI key missing · backup only";
    renderPhase();renderTables();
  }catch(error){$("#lastUpdated").textContent="Connection issue · retrying…";} 
  finally{state.busy=false;scheduleLoad(2200);}
}
function scheduleLoad(delay=2200){clearTimeout(state.poll);if(state.session)state.poll=setTimeout(load,delay);}
function stop(){clearTimeout(state.poll);clearInterval(state.timer);state.poll=null;state.timer=null;}
function enterControl(){
  $("#setupMsg").textContent=""; $("#finalReveal").classList.add("hidden"); $("#toggleReveal").textContent="Reveal text";
  $("#setupView").classList.add("hidden");$("#controlRoom").classList.remove("hidden");
  $("#fSessionCode").textContent=state.session;const url=`${location.origin}/?session=${encodeURIComponent(state.session)}`;$("#participantUrl").textContent=url;
  stop();load();state.timer=setInterval(renderTimer,1000);
}
async function createSession(){
  const code=$("#fCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10),pin=$("#fPin").value;
  if(!code||pin.length<4){$("#setupMsg").textContent="Use a session code and a PIN of at least 4 characters.";return;}
  try{await api("/api/session",{method:"POST",headers:{"x-facilitator-pin":pin},body:JSON.stringify({action:"create",code,pin})});state.session=code;state.pin=pin;enterControl();}
  catch(error){$("#setupMsg").textContent=error.message;}
}
async function openSession(){
  const code=$("#fCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10),pin=$("#fPin").value;
  if(!code||!pin){$("#setupMsg").textContent="Enter the existing session code and facilitator PIN.";return;}
  try{await api(`/api/session?code=${encodeURIComponent(code)}&admin=1`,{headers:{"x-facilitator-pin":pin}});state.session=code;state.pin=pin;enterControl();}
  catch(error){$("#setupMsg").textContent=error.message;}
}
async function setPhase(phase){
  try{await api("/api/session",{method:"POST",headers:adminHeaders(),body:JSON.stringify({action:"phase",code:state.session,phase})});toast(`${names[phase]} is now live.`);await load();}
  catch(error){toast(error.message,"error");}
}
$("#generateCode").addEventListener("click",()=>{$("#fCode").value=generateCode();});
$("#createSession").addEventListener("click",createSession);$("#openSession").addEventListener("click",openSession);
$("#advancePhase").addEventListener("click",()=>{const next=PHASES[phaseIndex()+1];if(next)setPhase(next);});
$("#backPhase").addEventListener("click",()=>{const prev=PHASES[phaseIndex()-1];if(prev&&confirm(`Move the whole room back to ${names[prev]}?`))setPhase(prev);});
$("#copyJoinLink").addEventListener("click",async()=>{const link=`${location.origin}/?session=${encodeURIComponent(state.session)}`;try{await navigator.clipboard.writeText(link);toast("Participant link copied ✓");}catch{toast(`Participant link: ${link}`);}});
$("#toggleReveal").addEventListener("click",()=>{const el=$("#finalReveal"),hidden=el.classList.toggle("hidden");$("#toggleReveal").textContent=hidden?"Reveal text":"Hide text";});
$("#resetSession").addEventListener("click",async()=>{
  const ok=confirm(`Reset ALL table data for session ${state.session}? This clears the rehearsal/live table progress but keeps the session code and PIN.`);if(!ok)return;
  try{await api("/api/session",{method:"POST",headers:adminHeaders(),body:JSON.stringify({action:"reset",code:state.session})});$("#finalReveal").classList.add("hidden");$("#toggleReveal").textContent="Reveal text";toast("Session table data reset ✓");await load();}catch(error){toast(error.message,"error");}
});
$("#returnSetup").addEventListener("click",()=>{stop();state.session="";$("#controlRoom").classList.add("hidden");$("#setupView").classList.remove("hidden");});
$("#fCode").value=generateCode();
