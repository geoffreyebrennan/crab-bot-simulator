#!/bin/sh
# Runs every route-related suite against the working page (Phase 2, sub-step 2.4). Needs: npm i three@0.128.0 in /tmp (or node_modules next to here).
cd "$(dirname "$0")"; ulimit -v 4000000
for t in resolve_tests parse_stop_tests claude_plan_tests stuck_tests route_fallback_tests route_stuck_tests; do printf '%-22s' "$t"; node $t.js 2>&1 | tail -1; done
printf '%-22s' route_follow; node route_follow.js 2>&1 | tail -1
