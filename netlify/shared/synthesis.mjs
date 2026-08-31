import { DIGITAL_INPUTS, STATIONS, THEMES } from "./data.mjs";

function emptyScores(){
  return Object.fromEntries(Object.keys(THEMES).map(key=>[
    key,{positive:0,friction:0,total:0}
  ]));
}

function addTags(scores,item,weight){
  for(const key of item.positive||[]){
    if(scores[key]){
      scores[key].positive+=weight;
      scores[key].total+=weight;
    }
  }
  for(const key of item.friction||[]){
    if(scores[key]){
      scores[key].friction+=weight;
      scores[key].total+=weight;
    }
  }
}

function strongest(scores,type){
  return Object.entries(scores)
    .filter(([key])=>THEMES[key])
    .sort((a,b)=>{
      const av=type==="positive"?a[1].positive:a[1].friction;
      const bv=type==="positive"?b[1].positive:b[1].friction;
      return bv-av || b[1].total-a[1].total || a[0].localeCompare(b[0]);
    })[0]?.[0] || "activities";
}

function headlineFor(topPositive,topFriction,positiveShare){
  if(positiveShare>=62){
    const map={
      activities:"Family Day was well received, with the activities standing out.",
      atmosphere:"Residents responded strongly to the lively CC–park atmosphere.",
      connection:"Family Day helped residents connect with the CC and one another.",
      volunteers:"Helpful volunteers were a visible strength of Family Day.",
      accessibility:"Indoor access and on-ground support were appreciated."
    };
    return map[topPositive] || "Family Day was positively received overall.";
  }

  const map={
    queues:"Family Day worked — but waiting time was the clearest friction.",
    wayfinding:"Family Day worked — but moving between the CC and park was confusing.",
    accessibility:"Family Day worked — but access and comfort need more attention.",
    age_fit:"Family Day worked — but the programme fit was uneven across age groups.",
    volunteers:"Family Day worked — but volunteer operations can be tightened.",
    comfort:"Family Day worked — but comfort affected the experience.",
    operations:"Family Day worked — but outdoor operations need attention."
  };
  return map[topFriction] || "Family Day was positively received — but logistics shaped the experience.";
}

function balanceLabel(positiveShare){
  if(positiveShare>=62)return "Mostly praise";
  if(positiveShare<=38)return "More improvement points";
  return "Mixed feedback";
}

function workedDetail(key){
  const map={
    activities:"Families and children responded well to the programme, especially the park games and hands-on activities.",
    atmosphere:"Residents liked the lively atmosphere and the way the Community Club and park were used together.",
    connection:"The event helped residents discover the Community Club and created opportunities to meet others.",
    volunteers:"Residents noticed helpful volunteers, and volunteers themselves were willing to contribute again.",
    accessibility:"Indoor access and volunteer support were positively recognised by residents who needed more assistance.",
    comfort:"Residents appreciated the outdoor setting, although comfort features still need attention.",
    wayfinding:"Residents still found value in the event despite some navigation issues.",
    queues:"The event itself was generally enjoyed even when waiting times affected the experience.",
    age_fit:"Some age groups found activities they enjoyed, especially children and those joining the sports challenge.",
    operations:"The park setting created a lively atmosphere and strong participation."
  };
  return map[key] || "Residents identified clear strengths worth keeping for the next Family Day.";
}

function attentionDetail(key){
  const map={
    queues:"Registration and food redemption queues were repeated friction points, especially during peak periods.",
    wayfinding:"Residents were not always sure how to move between the Community Club and park activity zones.",
    accessibility:"Outdoor routes, seating and physical comfort were not equally easy for every resident.",
    age_fit:"The programme worked better for some age groups than others, with teenagers and younger children needing clearer options.",
    volunteers:"Some volunteers started without enough clarity on roles, timing and breaks.",
    comfort:"Seating, shade and stroller space affected how long some families could comfortably stay.",
    operations:"Crowding and full bins appeared around the park after lunch.",
    activities:"Some residents wanted a wider mix of activities across age groups.",
    atmosphere:"The atmosphere was generally positive, with only limited concerns about the environment.",
    connection:"The event connected people, but more structured ways to meet others could strengthen that further."
  };
  return map[key] || "The feedback points to a practical area that organisers can improve next time.";
}

function actionDetail(key){
  const map={
    queues:"Stagger registration and food redemption, and add an extra counter during peak periods.",
    wayfinding:"Use one simple event map plus larger signs at every decision point between the CC and park.",
    accessibility:"Add more seating and shade, and check the full outdoor route for step-free and even access.",
    age_fit:"Design one clearly promoted activity stream for teens and one for preschool-aged children.",
    volunteers:"Send role assignments before the event and run a short briefing with clear break times.",
    comfort:"Create visible rest points with seating, shade and a designated stroller area.",
    operations:"Add bins and crowd-flow markers near the park exit before the lunchtime peak.",
    activities:"Keep the popular family activities and add one or two options for less-served age groups.",
    atmosphere:"Preserve the CC–park format while tightening the logistics around it.",
    connection:"Add a simple welcome or neighbour-introduction activity for residents who are new to the area."
  };
  return map[key] || "Keep the strongest parts of Family Day and fix the most repeated friction point first.";
}

function coverageNote(count){
  if(count===8)return "All 8 resident profiles were captured, giving this table the fullest ground picture.";
  if(count>=6)return `${count}/8 resident profiles were captured. The picture is strong, but a few voices are still missing.`;
  if(count>=3)return `${count}/8 resident profiles were captured. The dashboard is useful, but missing voices can change the emphasis.`;
  if(count>0)return `Only ${count}/8 resident profiles were captured. Treat the dashboard as an early read rather than the full picture.`;
  return "No resident profiles were captured. This dashboard is based only on the broader post-event feedback.";
}


function themeEvidence(key,captured){
  const residentMatches=captured
    .filter(item=>(item.positive||[]).includes(key)||(item.friction||[]).includes(key))
    .map(item=>item.source);

  const broaderMatches=DIGITAL_INPUTS
    .filter(item=>(item.positive||[]).includes(key)||(item.friction||[]).includes(key));

  return{
    residentSources:residentMatches,
    broaderCount:broaderMatches.length
  };
}

function themeInterpretation(key,score){
  if(score.friction>score.positive)return attentionDetail(key);
  if(score.positive>score.friction)return workedDetail(key);
  return `Feedback on ${THEMES[key]?.label?.toLowerCase() || "this theme"} is mixed, with both strengths and improvement points appearing.`;
}

function buildThemeDetail(key,score,captured,maxScore){
  const evidence=themeEvidence(key,captured);
  return{
    key,
    label:THEMES[key].label,
    percent:Math.max(18,Math.round((score.total/Math.max(maxScore,1))*100)),
    emphasis:score.friction>score.positive?"improve":score.positive>score.friction?"positive":"mixed",
    residentSources:evidence.residentSources,
    broaderCount:evidence.broaderCount,
    interpretation:themeInterpretation(key,score),
    action:actionDetail(key)
  };
}

function voiceDetail(captured){
  const capturedNames=captured.map(item=>item.source);
  const capturedSet=new Set(captured.map(item=>item.id));
  const missingNames=STATIONS.filter(item=>!capturedSet.has(item.id)).map(item=>item.source);
  return{
    captured:capturedNames,
    missing:missingNames,
    note:coverageNote(captured.length)
  };
}

export function buildDashboard(discoveredIds=[]){
  const idSet=new Set(discoveredIds);
  const captured=STATIONS.filter(item=>idSet.has(item.id));
  const scores=emptyScores();

  // Broader captured feedback provides a stable baseline.
  // Direct resident profiles are weighted more heavily so exact combinations
  // materially change the dashboard.
  for(const item of DIGITAL_INPUTS)addTags(scores,item,0.65);
  for(const item of captured)addTags(scores,item,4);

  const positiveTotal=Object.values(scores).reduce((sum,s)=>sum+s.positive,0);
  const frictionTotal=Object.values(scores).reduce((sum,s)=>sum+s.friction,0);
  const signalTotal=Math.max(positiveTotal+frictionTotal,1);
  const positiveShare=Math.round((positiveTotal/signalTotal)*100);
  const improvementShare=100-positiveShare;

  const topPositive=strongest(scores,"positive");
  const topFriction=strongest(scores,"friction");

  const ranked=Object.entries(scores)
    .sort((a,b)=>b[1].total-a[1].total || b[1].friction-a[1].friction || a[0].localeCompare(b[0]))
    .slice(0,4);

  const maxScore=Math.max(...ranked.map(([,v])=>v.total),1);
  const topThemes=ranked.map(([key,value])=>buildThemeDetail(key,value,captured,maxScore));

  const worked=THEMES[topPositive]?.positive || "Residents found clear strengths in the event.";
  const improve=THEMES[topFriction]?.improve || "Use the repeated feedback to target the next improvement.";

  const count=captured.length;
  const coveragePercent=Math.round((count/8)*100);
  const coverageLabel=count===8?"Full resident set":count>=6?"Strong coverage":count>=3?"Partial coverage":count>0?"Limited coverage":"No resident profiles";

  return{
    variationKey:captured.map(x=>x.id).sort().join("+")||"NONE",
    coverage:{captured:count,total:8,percent:coveragePercent,label:coverageLabel},
    feedbackMix:{
      positive:positiveShare,
      improvement:improvementShare,
      label:balanceLabel(positiveShare)
    },
    topThemes,
    topPositive:{key:topPositive,label:THEMES[topPositive].label},
    topFriction:{key:topFriction,label:THEMES[topFriction].label},
    headline:headlineFor(topPositive,topFriction,positiveShare),
    supporting:[worked,improve],
    whatWorked:workedDetail(topPositive),
    needsAttention:attentionDetail(topFriction),
    recommendedAction:actionDetail(topFriction),
    coverageNote:coverageNote(count),
    interactive:{
      voices:voiceDetail(captured),
      mix:{
        positive:positiveShare,
        improvement:improvementShare,
        label:balanceLabel(positiveShare),
        strongestPositive:THEMES[topPositive].label,
        strongestImprovement:THEMES[topFriction].label,
        note:"This is an indicative coded balance across feedback themes, not a satisfaction percentage."
      },
      themes:Object.fromEntries(topThemes.map(theme=>[theme.key,theme]))
    }
  };
}
