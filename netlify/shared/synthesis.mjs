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
  const topThemes=ranked.map(([key,value])=>({
    key,
    label:THEMES[key].label,
    percent:Math.max(18,Math.round((value.total/maxScore)*100)),
    emphasis:value.friction>value.positive?"improve":value.positive>value.friction?"positive":"mixed"
  }));

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
    supporting:[worked,improve]
  };
}
