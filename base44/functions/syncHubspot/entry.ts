import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { secrets } from 'base44:runtime';
import { makeHubspotClient, syncCompetition, syncPlay } from './hubspot.js';

export default async function syncHubspot(req: Request) {
  let entities, anchor, lockId;
  try {
    const base44 = createClientFromRequest(req);
    entities = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    let submission = null;
    // Public calls can only retry a saved, identified play using its unguessable
    // submission token. No client-supplied contact or note content is trusted.
    if (typeof body.submission_token === 'string' && body.submission_token.length <= 100) {
      submission = (await entities.PendingSubmission.filter({ token: body.submission_token }, undefined, 1))[0];
      if (!submission || submission.status !== 'completed' || !submission.lead_id) return Response.json({ error: 'Submission unavailable' }, { status: 404 });
    } else {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const key = secrets.get('Hubspot_VenueGuessr_Secret')?.trim();
    if (!key) return Response.json({ error: 'HubSpot secret is not configured' }, { status: 503 });
    if (!submission && body.check_only === true) {
      const checkApi = makeHubspotClient(key);
      await checkApi('/crm/v3/properties/contacts/email');
      await checkApi('/crm/v3/lists/search', 'POST', { count: 1, offset: 0 });
      await checkApi('/crm/v3/properties/notes/hs_note_body');
      return Response.json({ status: 'connected', message: 'HubSpot connection and read access verified. Write access is checked when syncing.' });
    }
    const leadId = submission?.lead_id || body.lead_id;
    let lead = leadId ? await entities.Lead.get(leadId) : null;
    if (lead && !lead.hubspot_status) return Response.json({ error: 'This historical lead is not queued for HubSpot' }, { status: 409 });
    if (lead?.hubspot_status === 'synced') return Response.json({ status: 'synced' });
    if (lead && !submission) submission = (await entities.PendingSubmission.filter({ lead_id: lead.id, status: 'completed' }, undefined, 1))[0];
    const competitionId = lead ? lead.competition_id : body.competition_id;
    if (lead && !competitionId) return Response.json({ error: 'Competition not found' }, { status: 409 });
    let competition = competitionId ? await entities.Competition.get(competitionId) : null;
    if (competitionId && !competition?.hubspot_enabled) return Response.json({ status: 'disabled' });
    if (lead && !submission) return Response.json({ error: 'Completed game not found' }, { status: 409 });

    // All provider writes are serialized across function instances, including
    // shared property options and two players updating the same contact.
    anchor = (await entities.Competition.list('created_date', 1))[0];
    if (!anchor) return Response.json({ status: 'empty' });
    lockId = crypto.randomUUID();
    const deadline = Date.now() + 120000;
    const acquired = await entities.Competition.updateMany({ id: anchor.id, $or: [
      { hubspot_lock_until: { $exists: false } }, { hubspot_lock_until: { $lte: new Date().toISOString() } },
    ] }, { $set: { hubspot_lock_id: lockId, hubspot_lock_until: new Date(deadline + 60000).toISOString() } });
    if (acquired.updated !== 1) return Response.json({ status: 'queued' });
    const api = makeHubspotClient(key, fetch, () => {
      if (Date.now() > deadline) throw new Error('Sync paused. Retry to continue.');
    });
    const run = async (comp, item = null, play = null) => {
      const entity = item ? entities.Lead : entities.Competition;
      const record = item || comp;
      try {
        if (!comp.hubspot_enabled) return 'disabled';
        await syncCompetition(api, entities, comp);
        if (item) await syncPlay(api, entities, item, play, comp);
        await entity.update(record.id, { hubspot_status: 'synced', hubspot_error: '', hubspot_next_retry: '', hubspot_attempts: 0 });
        return 'synced';
      } catch (error) {
        const attempts = (Number(record.hubspot_attempts) || 0) + 1;
        await entity.update(record.id, {
          hubspot_status: 'retry', hubspot_error: error.message?.startsWith('HubSpot') || /^(Set a valid|VenueGuessr Competition|An existing HubSpot|Note delivery|Sync paused)/.test(error.message || '') ? error.message : 'Sync failed. Retry or check the integration settings.',
          hubspot_attempts: attempts,
          hubspot_next_retry: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(attempts, 6))).toISOString(),
        });
        return 'retry';
      }
    };
    if (competition) {
      // Re-read after acquiring the lock: a previous worker may have finished
      // while this request was waiting, including saving the note ID.
      competition = await entities.Competition.get(competition.id);
      if (lead) lead = await entities.Lead.get(lead.id);
      if (lead?.hubspot_status === 'synced') return Response.json({ status: 'synced' });
      return Response.json({ status: await run(competition, lead, submission) });
    }
    // Admin-only queue drain. Only explicitly queued records are included;
    // upgrading the app never imports historical participants automatically.
    const due = { $or: [{ hubspot_next_retry: { $exists: false } }, { hubspot_next_retry: '' }, { hubspot_next_retry: { $lte: new Date().toISOString() } }] };
    const comps = await entities.Competition.filter({ hubspot_enabled: true, hubspot_status: { $in: ['pending', 'retry'] }, ...due }, 'created_date', 2);
    for (const comp of comps) await run(comp);
    const leads = await entities.Lead.filter({ hubspot_status: { $in: ['pending', 'retry'] }, ...due }, 'created_date', 3);
    for (const item of leads) {
      if (Date.now() > deadline - 30000) break;
      const comp = await entities.Competition.get(item.competition_id);
      const play = (await entities.PendingSubmission.filter({ lead_id: item.id, status: 'completed' }, undefined, 1))[0];
      if (play) await run(comp, item, play);
    }
    return Response.json({ status: 'processed' });
  } catch (_) {
    return Response.json({ error: 'HubSpot sync is unavailable. Saved games are safe; retry later.' }, { status: 503 });
  } finally {
    if (anchor && lockId) await entities.Competition.updateMany({ id: anchor.id, hubspot_lock_id: lockId }, { $set: { hubspot_lock_until: new Date(0).toISOString(), hubspot_lock_id: '' } }).catch(() => {});
  }
}
