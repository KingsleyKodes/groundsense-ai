# GroundSense AI v2.0

Launch-ready 10–15 minute experiential activity for 50–100 participants, designed around tables of 8.

## Core learning

Participants first experience the friction of gathering fragmented information from the ground. AI Mode then connects the table to a larger set of fictional information already captured through digital channels and uses a real OpenAI model to synthesise the evidence. A final piece of on-the-ground context changes how the recommendation should be interpreted.

**Intended takeaway:** AI can reduce the distance between information and action. Grassroots leaders still need to gather context, build relationships, exercise judgement, and take responsibility for decisions.

The app does **not** claim that AI magically gathers information on its own. It represents an AI-enabled system receiving information from connected channels such as feedback forms, attendance records, volunteer sign-ups, programme notes, and complaint logs.

## 10–15 minute run of show

- **Ground — 3 min:** one runner at a time visits a Ground Station, returns, and enters the four-digit code. Swap runners each trip.
- **AI — 3 min:** facilitator advances the room. Tables see 27 additional fictional digital inputs across five channels and run a live AI synthesis.
- **Human Context — 2 min:** one representative goes forward for a final Ground Update that the AI was not given. Tables adapt their decision.
- **Debrief — 2–4 min:** compare the table's first hypothesis, AI-supported synthesis, and final human judgement.

## Room setup

- One shared phone/tablet/laptop per table.
- Eight people per table.
- Print `/print.html` before the session.
- For 80–100 participants, print 2 copies of each Ground Station to reduce congestion.
- Keep the Final Ground Update covered until the Human Context phase.

## Launch

1. Deploy the whole repository to Netlify (not only the `public` folder).
2. In Netlify environment variables, provide `OPENAI_API_KEY` or the existing compatible name `OPEN_AI_KEY`, scoped to Functions/runtime.
3. Optional: set `OPENAI_MODEL`. Without it, the app first tries `gpt-5.6-luna` and can retry with `gpt-5` if the configured/default model is unavailable.
4. Open `/facilitator.html`.
5. Create a short session code and facilitator PIN.
6. Participants open the main site, enter the session code, and choose their physical table number.
7. Advance phases only from the facilitator control room.

## Reliability

- Table devices poll the facilitator-controlled phase and switch automatically.
- Netlify Blobs hold session, table, discovery, hypothesis, analysis, and decision state.
- The OpenAI API key stays server-side.
- OpenAI requests use the Responses API with Structured Outputs and `store: false`.
- If the live AI call times out or fails, the workshop returns a clearly labelled prepared backup synthesis so the activity can continue.
- AI synthesis is based only on the raw ground signals and digital inputs. The table's own hypothesis is saved for comparison but is **not** fed into the AI analysis.

## Rehearsal

The facilitator control room includes **Reset table data**. Use this after a rehearsal to clear joined tables, collected signals, hypotheses, AI results and decisions while keeping the same session code and PIN. Connected participant screens detect the new run version and clear their local workshop state too.

## Privacy

All resident information shipped in this project is fictional. Do not enter real personal or sensitive resident information unless your organisation has approved the data-handling arrangement.
