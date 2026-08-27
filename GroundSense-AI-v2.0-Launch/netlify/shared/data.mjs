export const STATIONS = [
  { id:"S1", code:"3814", source:"Older resident", text:"Activities are always on Saturday. That is when I visit my grandchildren." },
  { id:"S2", code:"5729", source:"First-time participant", text:"I came once. Everyone already seemed to know each other, so I left quite early." },
  { id:"S3", code:"1468", source:"Youth resident", text:"The activities are not really for people my age. I usually just play basketball downstairs." },
  { id:"S4", code:"9035", source:"Parent", text:"I would come more often if there was something my children could take part in too." },
  { id:"S5", code:"6241", source:"Potential volunteer", text:"I do not mind helping. I have just never really been asked directly." },
  { id:"S6", code:"7153", source:"Resident with a skill", text:"I can teach simple home cooking if people are interested. I would not mind helping with a small group." },
  { id:"S7", code:"4386", source:"Coffee shop operator", text:"People from this block come by every day, but most sit with the same few people and then go home." },
  { id:"S8", code:"2897", source:"Nearby resident", text:"Evening activities downstairs can get noisy. Some of us need the area to quieten down earlier." }
];

export const DIGITAL_INPUTS = [
  {channel:"Feedback form",text:"Two residents said weekend afternoons clash with family commitments."},
  {channel:"Feedback form",text:"Three residents asked for activities where they can contribute a skill rather than only attend."},
  {channel:"Feedback form",text:"A new resident said they were unsure who to approach when they arrived."},
  {channel:"Feedback form",text:"Several comments described large events as crowded or impersonal."},
  {channel:"Feedback form",text:"Parents asked for activities that children and adults can do together."},
  {channel:"Feedback form",text:"Two older residents preferred weekday mornings."},
  {channel:"Feedback form",text:"One youth asked for sports or creative activities rather than formal programmes."},
  {channel:"Feedback form",text:"A resident said WhatsApp announcements often arrive too late for them to plan."},
  {channel:"Feedback form",text:"One participant enjoyed the last event but did not return because nobody followed up."},
  {channel:"Feedback form",text:"Residents mentioned wanting to know neighbours on the same floor or block."},
  {channel:"Attendance record",text:"Large festive events attract many first-time participants but low repeat attendance."},
  {channel:"Attendance record",text:"Small interest groups have lower initial numbers but higher repeat participation."},
  {channel:"Attendance record",text:"Weekday morning sessions have stronger older-adult attendance."},
  {channel:"Attendance record",text:"Youth attendance rises when a peer invites them directly."},
  {channel:"Attendance record",text:"Family participation is stronger when children have an active role."},
  {channel:"Volunteer sign-up",text:"One resident listed cooking as a skill they can contribute."},
  {channel:"Volunteer sign-up",text:"Two residents said they can help for one hour but not run a full event."},
  {channel:"Volunteer sign-up",text:"A youth volunteer is willing to help with sports activities."},
  {channel:"Volunteer sign-up",text:"One resident can translate simple announcements into Mandarin."},
  {channel:"Programme note",text:"A facilitator observed that newcomers tended to sit with people they already knew."},
  {channel:"Programme note",text:"Personal invitations produced better response than general broadcast messages."},
  {channel:"Programme note",text:"A previous resident-led craft session continued informally after the official programme ended."},
  {channel:"Programme note",text:"A block-level gathering needed less manpower than a large central event."},
  {channel:"Complaint log",text:"Two noise complaints were linked to evening activities near residential units."},
  {channel:"Complaint log",text:"No complaints were recorded for weekday morning activities in the indoor room."},
  {channel:"Complaint log",text:"One complaint focused on duration rather than opposition to community activity."},
  {channel:"Complaint log",text:"Residents asked organisers to give clearer advance notice for activities using shared spaces."}
];

export const FALLBACK = {
  patterns:[
    "Timing, belonging and relevance recur as participation barriers; the data does not suggest simple disinterest.",
    "Smaller interest-based activities appear to produce stronger repeat participation than large one-off events.",
    "Personal invitation and follow-up appear important, especially for newcomers and younger residents."
  ],
  assets:[
    "Residents have skills they are willing to contribute, including cooking and sport.",
    "Some volunteers can help in short time blocks even if they cannot run a full event.",
    "Existing informal spaces and small-group formats may offer lower-friction ways to connect."
  ],
  cautions:[
    "Evening noise and use of shared spaces can create avoidable friction with nearby residents.",
    "Captured data can show patterns but may not contain the personal context behind each response."
  ],
  next_step:"Test one small resident-led activity at a quieter time, use personal invitations, give residents meaningful roles, and follow up with newcomers afterwards.",
  data_limit:"This synthesis can only reason over information that was captured and supplied. It may miss relational, cultural or personal context that was never recorded.",
  confidence_note:"Several channels point in similar directions, but a GRL should verify the interpretation on the ground before acting."
};

export const FINAL_CONTEXT = "The resident who offered to teach cooking recently lost her husband. She said she misses having people around and wants something meaningful to contribute. She is not simply an available programme resource; she may also be looking for connection and purpose.";
