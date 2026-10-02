# VenueGuessr → HubSpot

Server secret: `Hubspot_VenueGuessr_Secret`. Never put it in a Vite variable or browser request. Scope: this VenueGuessr app only.

New competitions default to HubSpot enabled. The start date is required and the segment is named `VenueGuessr — Competition name — dd/mm/yy`. Existing competitions remain off until an administrator enables them. Editing a name/date updates the existing option and segment; the option value remains `competition_<Base44 ID>`.

The `venueguessr_competition` contact property is an enumeration with checkbox display (multi-select). A dynamic contact segment matches each competition value with `IS_ANY_OF`. Membership updates asynchronously in HubSpot after the property changes.

On an identified, completed submission, the app queues the saved lead and immediately invokes the server sync after saving the score. Email locates the contact. First name, last name, and company fill empty fields only. Competition selections are appended. Each play creates a contact-associated note containing competition/date, submitted time, total score, bonus flag, average distance and the round results. No trade_show, score property, marketing status, subscription, owner or lifecycle fields are changed. Historical leads are not backfilled.

Lead and competition sync status/errors are admin-only. The Competition Manager drains small batches once a minute while open, and both managers offer manual retry. Failures use exponential backoff capped at one hour. Immediate background invocation is not a durable scheduler: unattended retries need an additional Base44 workflow. The current Base44 UI creates that workflow via the AI builder, which has no credits remaining. The queue endpoint requires a verified admin identity; do not weaken this guard for a scheduler. Verify the workflow's execution identity before enabling it.

Provider writes use a database lease on the oldest Competition record, with a bounded execution window. Do not delete that anchor while a sync is running. Reads are refreshed after acquiring the lease. The UI does not offer competition deletion. Schema option writes preserve existing options. A same-name segment with different rules is flagged rather than overwritten.

If a note POST times out or returns 5xx, the app searches the contact's notes for the play marker on retry. If no confirmed note is found, it leaves an explicit review warning and will not blindly create a second note. Once staff confirm the original request created no note, an admin can reset that lead's `hubspot_note_state` to `pending` in Base44 Data and retry. Never reset it without checking.

Required HubSpot permissions: contacts read/write, contact schemas read/write, lists read/write, and notes read/write as supported by the service key. Check HubSpot in Competition Manager verifies only the connection and read endpoints; successful real sync is needed to prove write access. Error responses never include HubSpot bodies or credentials. Preserve existing admin-only entity RLS.

Validation: `node --test tests/*.test.js`, frontend/backend type checks, lint, build and bundle budget. Mocked tests exercise token/admin access, CRM preservation, option/date mapping, ambiguous delivery, retry and lock handling. Live tests must not invent CRM contacts; use a user-approved own play if authorised.
