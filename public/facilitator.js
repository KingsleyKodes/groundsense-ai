const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const PHASES=["GROUND","AI","DEBRIEF"];
const names={GROUND:"Gather",AI:"AI",DEBRIEF:"Debrief"};
const suggested={GROUND:120,AI:180,DEBRIEF:180};
const cues={
  GROUND:{
    title:"Resident Voices.",
    say:"“Family Day is over. Each person will read one resident’s feedback, then bring the number representing that resident voice back to the table.”",
    do:"Start everyone together. Each person visits a different resident profile. When they return, the table enters the numbers representing the resident voices.",
    watch:"Make sure each table gathers a good spread of resident voices."
  },
  AI:{
    title:"AI combines resident voices with more Family Day feedback.",
    say:"“Now combine the resident voices you gathered with more Family Day feedback captured from online forms and other means.”",
    do:"Ask tables to tap Analyse the feedback and look at their dashboard.",
    watch:"Ask tables to tap Resident voices, Feedback mix and a Top theme. On phones the detail slides up from the bottom; on larger screens it opens from the right."
  },
  DEBRIEF:{
    title:"Many comments. One clearer picture.",
    say:"“AI can bring post-event feedback together, spot repeated themes and surface areas to improve.”",
    do:"Ask what became easier once the Family Day feedback was brought together.",
    watch:"Keep the debrief focused on using AI to process feedback after community activities."
  }
};

let state={session:"",pin:"",phase:"GROUND",phaseChangedAt:null,teams:[],poll:null,busy:false,timer:null};

async function api(path,options={},timeoutMs=9000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(path,{...options,signal:controller.signal,headers:{...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})}});
    let data={};try{data=await response.json();}catch{}
    if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);
    return data;
  }catch(error){
    if(error.name==="AbortError")throw new Error("Connection timed out. Try again.");
    throw error;
  }finally{clearTimeout(timer);}
}

function adminHeaders(){return{"x-facilitator-pin":state.pin};}
let toastTimer;
function toast(message,type="ok"){clearTimeout(toastTimer);const el=$("#fToast");el.textContent=message;el.classList.toggle("error",type==="error");el.classList.remove("hidden");toastTimer=setTimeout(()=>el.classList.add("hidden"),2500);}
function generateCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let out="";crypto.getRandomValues(new Uint32Array(4)).forEach(n=>out+=chars[n%chars.length]);return out;}
function phaseIndex(){return PHASES.indexOf(state.phase);}
function formatTime(seconds){const m=Math.floor(seconds/60),s=seconds%60;return`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}

function renderTimer(){
  if(!state.phaseChangedAt)return;
  const elapsed=Math.max(0,Math.floor((Date.now()-new Date(state.phaseChangedAt).getTime())/1000));
  $("#phaseTimer").textContent=formatTime(elapsed);
  $("#phaseTimer").classList.toggle("over",elapsed>suggested[state.phase]);
}

function renderPhase(){
  const i=phaseIndex();
  $("#fPhase").textContent=names[state.phase];
  $$("[data-fstep]").forEach((el,idx)=>{el.classList.toggle("done",idx<i);el.classList.toggle("current",idx===i);});
  const next=PHASES[i+1];
  $("#advancePhase").disabled=!next;
  $("#advancePhase").textContent=next?`Advance to ${names[next]} →`:"Workshop complete ✓";
  $("#backPhase").disabled=i<=0;
  const cue=cues[state.phase];
  $("#cueTitle").textContent=cue.title;
  $("#cueSay").textContent=cue.say;
  $("#cueDo").textContent=cue.do;
  $("#cueWatch").textContent=cue.watch;
  $("#suggestedTime").textContent=`Suggested: ${formatTime(suggested[state.phase])}`;
  renderTimer();
}

function renderTables(){
  $("#joinedCount").textContent=state.teams.length;
  $("#tableList").innerHTML=state.teams.length?state.teams.map(t=>`
    <div class="table-row">
      <div class="table-name">Table ${t.team}</div>
      <div class="signals">
        <div class="small strong">${t.discovered}/8 ground</div>
        <div class="mini-progress"><span style="width:${Math.min(100,t.discovered/8*100)}%"></span></div>
      </div>
      <div class="${t.analysed?"ok":"pending"}">${t.analysed?"AI ✓":"AI —"}</div>
    </div>
  `).join(""):'<p class="muted">Waiting for tables to join…</p>';
}

async function load(){
  if(!state.session||state.busy)return;
  state.busy=true;
  try{
    const d=await api(`/api/session?code=${encodeURIComponent(state.session)}&admin=1`,{headers:adminHeaders()},7000);
    state.phase=d.phase;
    state.phaseChangedAt=d.phaseChangedAt;
    state.teams=d.teams||[];
    $("#lastUpdated").textContent=`Updated ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
    renderPhase();renderTables();
  }catch{
    $("#lastUpdated").textContent="Connection issue · retrying…";
  }finally{
    state.busy=false;
    scheduleLoad(2200);
  }
}

function scheduleLoad(delay=2200){clearTimeout(state.poll);if(state.session)state.poll=setTimeout(load,delay);}
function stop(){clearTimeout(state.poll);clearInterval(state.timer);state.poll=null;state.timer=null;}

function enterControl(){
  $("#setupMsg").textContent="";
  $("#setupView").classList.add("hidden");
  $("#controlRoom").classList.remove("hidden");
  $("#fSessionCode").textContent=state.session;
  $("#participantUrl").textContent=`${location.origin}/?session=${encodeURIComponent(state.session)}`;
  stop();load();state.timer=setInterval(renderTimer,1000);
}

async function createSession(){
  const code=$("#fCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10),pin=$("#fPin").value;
  if(!code||pin.length<4){$("#setupMsg").textContent="Use a session code and a PIN of at least 4 characters.";return;}
  try{
    await api("/api/session",{method:"POST",headers:{"x-facilitator-pin":pin},body:JSON.stringify({action:"create",code,pin})});
    state.session=code;state.pin=pin;enterControl();
  }catch(error){$("#setupMsg").textContent=error.message;}
}

async function openSession(){
  const code=$("#fCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10),pin=$("#fPin").value;
  if(!code||!pin){$("#setupMsg").textContent="Enter the session code and PIN.";return;}
  try{
    await api(`/api/session?code=${encodeURIComponent(code)}&admin=1`,{headers:{"x-facilitator-pin":pin}});
    state.session=code;state.pin=pin;enterControl();
  }catch(error){$("#setupMsg").textContent=error.message;}
}

async function setPhase(phase){
  try{
    await api("/api/session",{method:"POST",headers:adminHeaders(),body:JSON.stringify({action:"phase",code:state.session,phase})});
    toast(`${names[phase]} is now live.`);
    await load();
  }catch(error){toast(error.message,"error");}
}

$("#generateCode").addEventListener("click",()=>{$("#fCode").value=generateCode();});
$("#createSession").addEventListener("click",createSession);
$("#openSession").addEventListener("click",openSession);
$("#advancePhase").addEventListener("click",()=>{const next=PHASES[phaseIndex()+1];if(next)setPhase(next);});
$("#backPhase").addEventListener("click",()=>{const prev=PHASES[phaseIndex()-1];if(prev&&confirm(`Move the room back to ${names[prev]}?`))setPhase(prev);});
$("#copyJoinLink").addEventListener("click",async()=>{const link=`${location.origin}/?session=${encodeURIComponent(state.session)}`;try{await navigator.clipboard.writeText(link);toast("Participant link copied ✓");}catch{toast(`Participant link: ${link}`);}});
$("#resetSession").addEventListener("click",async()=>{
  if(!confirm(`Reset ALL table data for ${state.session}?`))return;
  try{
    await api("/api/session",{method:"POST",headers:adminHeaders(),body:JSON.stringify({action:"reset",code:state.session})});
    toast("Session table data reset ✓");
    await load();
  }catch(error){toast(error.message,"error");}
});
$("#returnSetup").addEventListener("click",()=>{stop();state.session="";$("#controlRoom").classList.add("hidden");$("#setupView").classList.remove("hidden");});
$("#fCode").value=generateCode();
