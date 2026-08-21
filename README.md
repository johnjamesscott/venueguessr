# VenueGuessr

VenueGuessr is a kiosk game built with Base44. Players explore a 3D venue tour, place a pin on the map, then save their score by scanning a QR code or using the kiosk form.

## Local setup

1. Install dependencies with `npm install`.
2. Create `.env.local` with `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL`.
3. Start the local app with `npm run dev`.

Run the full local quality check before opening a pull request:

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

## How the live game works

- The public kiosk and mobile score form do not require sign-in.
- Venue records, leads, leaderboard administration and competition settings remain admin-only.
- A short-lived server session fixes the venue pool, round count and ICP setting when a game starts.
- The server recalculates every score from the submitted map coordinates and venue coordinates. Client-submitted score totals are not trusted.
- QR codes are generated in the browser, so private score links are not sent to a QR-image provider.
- The next Matterport tour starts loading invisibly during the current round. This is intentional for event Wi-Fi reliability.
- Tours marked unhealthy by the admin health check are held out of new games until they pass again.

## Admin checks before an event

1. Open **Admin → Venues** and run **Check active tours**.
2. Confirm there are enough healthy active venues for the configured round count, plus spares.
3. Play a full normal game and a boosted game on the actual kiosk connection.
4. Scan the QR code on a phone, submit a test business address and confirm the kiosk advances.
5. Confirm the score, per-round multiplier and leaderboard rank are correct.
6. Delete any test lead and leaderboard data created during the check.

## Release checklist

Merging GitHub changes and publishing the Base44 app are separate steps. After the pull request is reviewed:

1. Merge the pull request.
2. Confirm the Base44 editor has synced the merged commit.
3. Publish in Base44.
4. Run Base44's security scan and review any warnings about public functions, secrets or entity permissions.
5. Test the live kiosk journey from start through score submission.
6. Check the live admin venue-health action and confirm no real lead data is visible publicly.

Do not put API keys in frontend code or committed environment files. Lead names and emails should only be handled by the private Base44 entities and server-side functions that need them.
