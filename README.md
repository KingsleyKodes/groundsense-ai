# GroundSense AI v2.8 — Responsive Interactive Dashboard

v2.8 reworks the dashboard drill-down for mobile usability.

## Phone / small tablet
Tapping Resident voices, Feedback mix, or a Top theme opens a bottom sheet. The sheet appears in the current viewport, keeps the dashboard behind it, supports a large Close button, backdrop-to-close, Escape, and a downward swipe-to-close gesture.

## Tablet / desktop
The same interaction opens a right-side drawer.

## UX principle
Tap → detail comes to you → close → return to the same dashboard position.

The old inline below-the-fold detail panel has been removed, and no detail auto-opens when analysis first loads.

## Dynamic analysis
The deterministic backend remains unchanged and still supports all 256 possible subsets of the 8 resident profiles. No external AI API is required.

## Netlify
- Base directory: blank
- Build command: blank
- Publish directory: `public`
- Functions directory: `netlify/functions`
