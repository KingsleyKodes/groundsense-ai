const $=s=>document.querySelector(s);
let session="",pin="",timer=null;
async function api(path,options={}){
  const r=await fetch(path,{headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
  let d={};try{d=await r.json()}catch{}
  if(!r.ok)throw new Error(d.error||`Request failed (${r.status})`);
  return d;
}
const cues={
  GROUND:["Send one person at a time.","Participants visit the Ground Stations and return with a 4-digit code. Keep the friction visible."],
  AI:["Connect the digital channels.","Tell tables: AI is not magically collecting data. It is working across information already collected in digital channels, plus what they gathered."],
  CONTEXT:["Send one representative forward.","Reveal the Final Ground Update at the front. Representatives return and tell their table. Do not put the update on participant screens."],
  DEBRIEF:["Same community. More context. Better decision.","Land the distinction: AI helps process volume and patterns; GRLs still understand context, relationships and responsibility."]
};
async function load(){
  if(!session)return;
  try{
    const d=await api(`/.netlify/functions/session?code=${encodeURIComponent(session)}&admin=1&pin=${encodeURIComponent(pin)}`);
    $("#fPhase").textContent=d.phase;$("#fPhasePill").textContent=d.phase;
    $("#cueTitle").textContent=cues[d.phase][0];$("#cueText").textContent=cues[d.phase][1];
    $("#lastUpdated").textContent=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const teams=d.teams||[];
    $("#tableList").innerHTML=teams.length?teams.map(t=>`
      <div class="table-row">
        <div class="name"><span class="dot ${t.discovered>0?"ok":""}"></span><strong>Table ${t.team}</strong></div>
        <div>${t.discovered}/8 ground</div>
        <div>${t.analysed?"AI ✓":"AI —"}</div>
        <div>${t.decided?"Decision ✓":"Decision —"}</div>
      </div>`).join(""):'<p class="muted">No table activity yet.</p>';
  }catch(e){$("#setupMsg").textContent=e.message;}
}
async function create(){
  session=$("#fCode").value.trim().toUpperCase();pin=$("#fPin").value.trim();
  if(!session||pin.length<4){$("#setupMsg").textContent="Use a session code and a facilitator PIN of at least 4 characters.";return;}
  try{
    await api("/.netlify/functions/session",{method:"POST",body:JSON.stringify({action:"create",code:session,pin})});
    enter();
  }catch(e){$("#setupMsg").textContent=e.message;}
}
async function openExisting(){
  session=$("#fCode").value.trim().toUpperCase();pin=$("#fPin").value.trim();
  try{await api(`/.netlify/functions/session?code=${encodeURIComponent(session)}&admin=1&pin=${encodeURIComponent(pin)}`);enter();}
  catch(e){$("#setupMsg").textContent=e.message;}
}
function enter(){
  $("#setupMsg").textContent="";
  $("#controlRoom").classList.remove("hidden");
  $("#fIdentity").textContent=`Session ${session}`;
  clearInterval(timer);timer=setInterval(load,2000);load();
}
$("#createSession").addEventListener("click",create);
$("#openSession").addEventListener("click",openExisting);
document.querySelectorAll(".phaseBtn").forEach(b=>b.addEventListener("click",async()=>{
  try{
    await api("/.netlify/functions/session",{method:"POST",body:JSON.stringify({action:"phase",code:session,pin,phase:b.dataset.phase})});
    await load();
  }catch(e){$("#setupMsg").textContent=e.message;}
}));
