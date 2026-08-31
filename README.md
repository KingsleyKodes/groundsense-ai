# GroundSense AI v2.8.1 — Sticky Interactive Drawer

Bug-fix release for v2.8.

## What was wrong
The participant page polls the workshop session in the background about every 2.2 seconds.

In v2.8, each poll re-rendered the dashboard and `renderAnalysis()` unconditionally closed the open detail sheet/drawer. That is why the pop-up could appear to close by itself.

## What is fixed
- Resident voices stays open during background refreshes.
- Feedback mix stays open during background refreshes.
- A Top-theme drill-down stays open during background refreshes.
- The currently open detail refreshes in place if the underlying analysis updates.
- Participants still close it manually using ×, backdrop, Escape, or mobile swipe-down.
- The underlying Family Day analysis and all resident combinations are unchanged.

## Netlify
- Base directory: blank
- Build command: blank
- Publish directory: `public`
- Functions directory: `netlify/functions`
