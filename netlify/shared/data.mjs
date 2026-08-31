export const THEMES = {
  activities:{
    label:"Activities",
    positive:"Activities were a clear strength.",
    improve:"Keep the strongest activities easy to find and join."
  },
  atmosphere:{
    label:"Atmosphere",
    positive:"Residents liked the lively CC–park atmosphere.",
    improve:"Protect the welcoming atmosphere while improving flow."
  },
  connection:{
    label:"Community connection",
    positive:"Family Day helped residents discover the CC and meet others.",
    improve:"Create more simple ways for residents to connect."
  },
  queues:{
    label:"Queues & waiting",
    positive:"",
    improve:"Reduce registration and food waiting times."
  },
  wayfinding:{
    label:"Wayfinding",
    positive:"",
    improve:"Make directions between the CC and park clearer."
  },
  accessibility:{
    label:"Accessibility",
    positive:"Volunteers and indoor access were appreciated.",
    improve:"Improve seating and accessible outdoor routes."
  },
  age_fit:{
    label:"Age-group fit",
    positive:"",
    improve:"Offer clearer options for teens and younger children."
  },
  volunteers:{
    label:"Volunteer experience",
    positive:"Helpful volunteers were noticed and appreciated.",
    improve:"Give volunteers clearer roles and briefing."
  },
  comfort:{
    label:"Comfort & amenities",
    positive:"",
    improve:"Add more seating, shade and stroller space."
  },
  operations:{
    label:"Outdoor operations",
    positive:"",
    improve:"Plan better for crowding, bins and busy periods."
  }
};

export const STATIONS = [
  {
    id:"S1", code:"3814", source:"Senior resident",
    text:"I enjoyed the performances and the park was nice and breezy. But the registration queue was long and there was nowhere to sit while waiting.",
    positive:["atmosphere","activities"],
    friction:["queues","comfort"]
  },
  {
    id:"S2", code:"5729", source:"Parent with a preschooler",
    text:"My daughter loved the craft corner. I would have stayed longer if there were more toddler-friendly activities and a clearer place to park our stroller.",
    positive:["activities"],
    friction:["age_fit","comfort"]
  },
  {
    id:"S3", code:"1468", source:"Parent with school-age children",
    text:"The children really enjoyed the games at the park. The food coupon queue around lunchtime was the main frustration for us.",
    positive:["activities"],
    friction:["queues"]
  },
  {
    id:"S4", code:"9035", source:"Teen resident",
    text:"The sports challenge at the park was fun. Most of the other activities felt more suited to younger children and parents, so my friends left quite early.",
    positive:["activities"],
    friction:["age_fit"]
  },
  {
    id:"S5", code:"6241", source:"New resident",
    text:"It was a good way to discover the Community Club and meet people. I was confused about which activities were inside the CC and which were at the park, so I missed one station.",
    positive:["connection"],
    friction:["wayfinding"]
  },
  {
    id:"S6", code:"7153", source:"Resident with mobility needs",
    text:"The volunteers were very helpful and the CC was easy to enter. Some activities at the park were harder for me to reach because the route crossed uneven ground.",
    positive:["volunteers","accessibility"],
    friction:["accessibility"]
  },
  {
    id:"S7", code:"4386", source:"Resident volunteer",
    text:"I enjoyed helping and would volunteer again. The briefing could have been clearer because I only found out my role and break time shortly before the event started.",
    positive:["volunteers"],
    friction:["volunteers"]
  },
  {
    id:"S8", code:"2897", source:"Park regular",
    text:"The atmosphere was lively and it was nice to see families using the park. After lunch, the bins near the park exit filled up and part of the path became crowded.",
    positive:["atmosphere"],
    friction:["operations"]
  }
];

export const DIGITAL_INPUTS = [
  {channel:"Online feedback form",text:"A family rated the event highly and said the children's activities were the main reason they stayed for more than two hours.",positive:["activities"],friction:[]},
  {channel:"Online feedback form",text:"Three respondents mentioned long queues at registration between 9.30am and 10.15am.",positive:[],friction:["queues"]},
  {channel:"Online feedback form",text:"Two respondents asked for more seating near registration and the outdoor activity area.",positive:[],friction:["comfort"]},
  {channel:"Online feedback form",text:"Four parents praised the craft and family game stations.",positive:["activities"],friction:[]},
  {channel:"Online feedback form",text:"Two parents said the lunchtime food coupon queue took more than 15 minutes.",positive:[],friction:["queues"]},
  {channel:"Online feedback form",text:"A parent with a stroller said the stroller parking area was difficult to identify.",positive:[],friction:["comfort","wayfinding"]},
  {channel:"Online feedback form",text:"Two teenagers said they enjoyed the sports challenge but wanted more activities aimed at secondary-school youth.",positive:["activities"],friction:["age_fit"]},
  {channel:"Online feedback form",text:"A new resident said the event helped them learn what the Community Club offers.",positive:["connection"],friction:[]},
  {channel:"Online feedback form",text:"Three respondents said directions between the Community Club and park activity zones could be clearer.",positive:[],friction:["wayfinding"]},
  {channel:"Online feedback form",text:"A resident with mobility needs said the indoor areas were accessible but part of the park route was difficult to use.",positive:["accessibility"],friction:["accessibility"]},

  {channel:"QR feedback",text:"Most QR respondents described the overall atmosphere as friendly and lively.",positive:["atmosphere"],friction:[]},
  {channel:"QR feedback",text:"The park-based family games received the highest number of positive comments in the QR survey.",positive:["activities"],friction:[]},
  {channel:"QR feedback",text:"Wayfinding between indoor and outdoor activities appeared repeatedly in open-text comments.",positive:[],friction:["wayfinding"]},
  {channel:"QR feedback",text:"Several respondents asked for more shaded or seated rest points outdoors.",positive:[],friction:["comfort"]},
  {channel:"QR feedback",text:"One respondent praised volunteers for proactively assisting a senior resident.",positive:["volunteers"],friction:[]},
  {channel:"QR feedback",text:"Two respondents suggested staggering food redemption times to reduce queues.",positive:[],friction:["queues"]},

  {channel:"Volunteer debrief",text:"Volunteers reported that registration was busiest during the first 45 minutes.",positive:[],friction:["queues"]},
  {channel:"Volunteer debrief",text:"Two volunteers were unsure about their assigned roles when they arrived.",positive:[],friction:["volunteers"]},
  {channel:"Volunteer debrief",text:"Volunteers said families frequently asked where the park activities were located.",positive:[],friction:["wayfinding"]},
  {channel:"Volunteer debrief",text:"The sports team reported strong participation from children but fewer teenagers after the first hour.",positive:["activities"],friction:["age_fit"]},

  {channel:"Attendance and operations",text:"Check-in peaked between 9.30am and 10.00am.",positive:[],friction:["queues"]},
  {channel:"Attendance and operations",text:"Family game stations at the park had steady participation throughout the morning.",positive:["activities"],friction:[]},
  {channel:"Attendance and operations",text:"The teen sports challenge was busiest early, then participation dropped before noon.",positive:[],friction:["age_fit"]},
  {channel:"Attendance and operations",text:"Food redemption peaked sharply around 12.00pm.",positive:[],friction:["queues"]},

  {channel:"Facilities observation",text:"Directional signs were placed at the CC entrance but not at every junction leading to the park.",positive:[],friction:["wayfinding"]},
  {channel:"Facilities observation",text:"Two outdoor bins near the park exit were full shortly after lunch.",positive:[],friction:["operations"]},
  {channel:"Facilities observation",text:"The accessible indoor route was clear, while one outdoor route included an uneven grass edge.",positive:["accessibility"],friction:["accessibility"]}
];
