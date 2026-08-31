# GroundSense AI v2.5 — Dynamic Family Day Dashboard

This build adds a visual post-event feedback dashboard and a deterministic backend synthesis engine.

## Dynamic analysis

The analysis is based on the **exact resident profiles that each table collected**.

There are 8 resident profiles, so the backend can safely handle all **256 possible subsets**:
- 0/8
- every possible 1/8 combination
- every possible 2/8 combination
- ...
- 8/8

The broader fictional post-event feedback remains a stable baseline, while resident profiles are weighted more heavily. This means two tables with the same number of resident comments can still see different emphasis if they captured different resident archetypes.

## Dashboard

The participant dashboard shows:
- Resident voices captured: X/8
- Feedback mix: praise vs improvement points
- Top 4 themes as visual bars
- One big AI finding
- Two short supporting points

Possible themes include activities, atmosphere, community connection, queues, wayfinding, accessibility, age-group fit, volunteer experience, comfort and outdoor operations.

## Workshop mode

This remains a deterministic simulation:
- no API credits required
- no external AI call
- no unpredictable output
- same exact subset always gives the same result
- reset starts a fresh table analysis

## Netlify
- Base directory: blank
- Build command: blank
- Publish directory: `public`
- Functions directory: `netlify/functions`
