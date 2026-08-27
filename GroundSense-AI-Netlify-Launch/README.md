# GroundSense AI — Grassroots AI Experiential Lab

A launch-ready 10–15 minute experiential activity for 50–100 participants, designed around tables of 8.

## Learning idea

Participants first experience the friction of gathering fragmented information from the ground. Then a facilitator activates AI Mode, where the app connects the table to a larger set of simulated digital feedback channels and uses a real OpenAI model to synthesise the information. Finally, a representative has to go back to the ground for contextual information that changes how the AI recommendation should be interpreted.

The intended takeaway is:

> AI can help process and synthesise information at scale. Grassroots leaders still need to gather context, build relationships, exercise judgement, and decide what to do.

The app deliberately **does not claim that AI magically collects data by itself**. It represents AI working on information collected through digital channels such as feedback forms, attendance records, volunteer sign-ups, programme notes, and complaint logs.

## Run of show

1. **Ground Mode — 3 min**
   - One person at a time leaves the table.
   - They visit one of 8 information stations.
   - Each station has a resident/community clue and a four-digit return code.
   - The runner returns and the table enters the code into the shared table device.
   - Teams form a human working hypothesis from whatever they manage to gather.

2. **AI Mode — 3 min**
   - Facilitator changes the session phase.
   - Every table device updates automatically.
   - The app shows 27 additional simulated digital inputs from multiple channels.
   - The table taps **Analyse with AI**.
   - A real OpenAI Responses API call synthesises the collected ground information + digital inputs.

3. **Human Context — 2 min**
   - Facilitator advances the phase.
   - One representative from each table comes forward.
   - They read/hear the final Ground Update, return, and tell the table.
   - The table decides how the new relational context changes its response.

4. **Debrief — 2–4 min**
   - Facilitator advances to Debrief.
   - The final screen contrasts human ground knowledge, AI synthesis, and human judgement.

## Recommended room setup

- 1 shared phone/tablet/laptop per table.
- 8 people per table.
- Print the 8 Ground Stations from `/print.html`.
- Place the stations around the room.
- Put the **Final Ground Update** at the front of the room and keep it covered until Human Context.
- For 80–100 participants, print 2 copies of each station or spread the stations widely enough to prevent bottlenecks.

## Deploy to Netlify

### Option A — drag/deploy via Git
1. Unzip this project.
2. Push the folder to GitHub/GitLab/Bitbucket.
3. Create a Netlify project from that repository.
4. Add the environment variable `OPENAI_API_KEY` in **Project configuration → Environment variables** with Functions access.
5. Optional: set `OPENAI_MODEL`. The default in the code is `gpt-5`.
6. Deploy.

### Option B — Netlify CLI
```bash
npm install
npx netlify login
npx netlify init
npx netlify env:set OPENAI_API_KEY "YOUR_KEY"
npx netlify deploy --build
npx netlify deploy --build --prod
```

## Launch workflow

1. Open `/facilitator.html`.
2. Create a session code, e.g. `AI27`.
3. Set a facilitator PIN.
4. Participants open the main site URL and join using the session code and their table number.
5. Leave the phase on **GROUND** until the physical information-gathering round is complete.
6. Switch to **AI**.
7. Switch to **CONTEXT**.
8. Switch to **DEBRIEF**.

The facilitator screen shows each table's discovered-signal count, whether its AI synthesis has been completed, and whether it submitted an adaptation.

## Reliability / fallback

If the OpenAI key is missing or an API call fails, the AI endpoint returns a clearly-labelled deterministic fallback synthesis so the workshop can continue. The table UI shows whether the result came from **Live AI** or **Workshop fallback**.

For the live session, test one full run on the deployed URL before participants enter.

## Privacy

This workshop ships with fictional/simulated resident data only. Do not paste real personal or sensitive resident information into the workshop build unless your organisation has approved the data handling and privacy arrangements.

The OpenAI request is made server-side; the API key is never exposed in browser code. The request uses `store: false`.

## Production architecture

- Static participant interface in `/public`.
- Netlify Functions for session control, discovery recording, AI analysis, and final decisions.
- Netlify Blobs for simple session/team state.
- OpenAI Responses API from the serverless `analyse` function.
