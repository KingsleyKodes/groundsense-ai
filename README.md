# GroundSense AI v2.7 — Interactive Dynamic Dashboard

The Family Day dashboard is now interactive while remaining large-text and workshop-friendly.

## What participants can tap

### Resident voices
Shows:
- which resident archetypes the table captured
- which resident voices are missing
- a short coverage interpretation

### Feedback mix
Shows:
- indicative praise vs improvement balance
- strongest positive theme
- strongest improvement theme
- an accuracy note that the ring is a coded thematic balance, not a satisfaction percentage

### Any Top Theme
Each theme bar is tappable. The detail panel changes to show:
- what the theme means in this table's analysis
- how many captured resident voices mention it
- how many broader post-event feedback items also point to it
- which resident profiles contributed
- a suggested next move

The exact resident profiles captured still drive the dashboard. The same subset is deterministic; different subsets can change the theme ranking, drill-down evidence, headline and recommendation.

## Backend
- supports all 256 subsets of 8 resident profiles
- analysis cache schema bumped to v7 so older cached dashboards are automatically regenerated
- no external AI API required

## Netlify
- Base directory: blank
- Build command: blank
- Publish directory: `public`
- Functions directory: `netlify/functions`
