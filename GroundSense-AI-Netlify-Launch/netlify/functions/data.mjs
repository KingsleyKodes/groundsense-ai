export const STATIONS = [
  { id:"S1", code:"3814", source:"Resident — older adult", text:"Activities are always on Saturday. That is when I visit my grandchildren." },
  { id:"S2", code:"5729", source:"Resident — first-time participant", text:"I came once. Everyone already seemed to know each other, so I left quite early." },
  { id:"S3", code:"1468", source:"Youth resident", text:"The activities are not really for people my age. I usually just play basketball downstairs." },
  { id:"S4", code:"9035", source:"Parent", text:"I would come more often if there was something my children could take part in too." },
  { id:"S5", code:"6241", source:"Potential volunteer", text:"I do not mind helping. I have just never really been asked directly." },
  { id:"S6", code:"7153", source:"Community asset", text:"A resident has offered to teach simple home cooking if there is interest." },
  { id:"S7", code:"4386", source:"Programme history", text:"Smaller interest-based activities have had better repeat attendance than large one-off events." },
  { id:"S8", code:"2897", source:"Resident concern", text:"Evening activities downstairs can get noisy. Some residents have complained before." }
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
    "Participation barriers are not simply a lack of interest: timing, belonging and relevance recur across the inputs.",
    "Smaller, interest-based activities show stronger repeat participation than large one-off events.",
    "Personal invitation and follow-up appear to matter, especially for newcomers and youth."
  ],
  assets:[
    "Residents are willing to contribute skills, including cooking and sport.",
    "Some volunteers can help in small time blocks even if they cannot run a full event.",
    "Existing block-level and interest-based formats appear easier to sustain with limited manpower."
  ],
  cautions:[
    "Evening noise and shared-space use can create avoidable friction with nearby residents.",
    "Digital feedback shows patterns, but it does not explain every person's motivation or circumstances."
  ],
  next_step:"Test a small resident-led activity at a quieter time, invite people personally, give residents meaningful roles, and follow up with newcomers after the session.",
  data_limit:"The synthesis can only reason over the information supplied. It may miss relational, cultural or personal context that has not been captured.",
  confidence_note:"The evidence is directionally consistent across several channels, but a GRL should verify the interpretation on the ground before acting."
};
