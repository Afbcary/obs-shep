# E2E fixtures

`event-search-response.json` is a real response from the Ultirzr search API,
captured so the E2E test in `e2e/schedule-caps-copy.spec.js` can exercise
the app against realistic tournament data without depending on a live,
ever-changing API (or hitting a real event on every test run).

It was fetched on 2026-07-24 with:

```sh
curl "https://www.ultirzr.app/api/v1/events/search?query=Filling%20the%20Void&state=NC&year=2026&minimumStartDate=2026-07-01&sortStartDate=asc"
```

which returned the event "Filling the Void 2026" (EventId 207013840, played
2026-07-18/19 in Hickory, NC) — a completed tournament with real field
assignments, start times, and scores across two divisions.

## Regenerating

To capture a different event (e.g. once this one ages out), query the same
endpoint for a currently-relevant tournament and save the raw response body
as this file, then update the golden values (`EXPECTED_FIELD_COUNT`,
`EXPECTED_DATETIME_COUNT`, `EXPECTED_GAME_COUNT`) at the top of
`e2e/schedule-caps-copy.spec.js` to match. Those values were derived by
running Tournament.js's schedule-building logic against the fixture offline
(see the git history of this file for the script used) rather than hardcoded
by hand.
