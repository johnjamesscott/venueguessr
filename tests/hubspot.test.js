import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { PROPERTY, noteTimestamp, competitionLabel, segmentBody, mergeOptions, contactProperties, noteBody, makeHubspotClient, syncPlay, syncCompetition, HubspotError } from '../base44/functions/syncHubspot/hubspot.js';
const comp = { id: 'c1', name: 'Confex', start_date: '2027-02-24', hubspot_enabled: true };
const play = { id: 'play1', total_score: 200, round_results: [{ venue_name: '<img src=x>', city: 'London', score: 100, distance_km: 1.5 }], completed_at: '2027-02-24T12:00:00Z' };
const lead = { id: 'l1', competition_id: 'c1', email: 'person@example.test', first_name: 'Person', last_name: 'Test', company: 'Example', hubspot_status: 'pending' };

test('competition names use start date, stable values and multi-value segment membership', () => {
  assert.equal(competitionLabel(comp), 'Confex — 24/02/27');
  assert.throws(() => competitionLabel({ ...comp, start_date: '' }));
  assert.throws(() => competitionLabel({ ...comp, start_date: '2027-02-30' }));
  const segment = segmentBody(comp);
  assert.equal(segment.name, 'VenueGuessr — Confex — 24/02/27');
  assert.equal(segment.processingType, 'DYNAMIC');
  assert.equal(segment.filterBranch.filterBranches[0].filters[0].operation.operator, 'IS_ANY_OF');
  const options = mergeOptions([{ value: 'old', label: 'Past event' }, { value: 'competition_c1', label: 'Old title', displayOrder: 2 }], comp);
  assert.equal(options.length, 2);
  assert.equal(options[0].value, 'old');
  assert.equal(options[1].displayOrder, 2);
});
test('contact updates append competition and preserve existing CRM details', () => {
  const props = contactProperties(lead, comp, { firstname: 'Original', lastname: 'Name', company: 'Current company', [PROPERTY]: 'old' });
  assert.deepEqual(props, { [PROPERTY]: ';competition_c1' });
  assert.equal(contactProperties(lead, comp).email, lead.email);
  for (const key of ['trade_show', 'lifecyclestage', 'hubspot_owner_id', 'hs_marketable_status', 'consent']) assert.equal(key in props, false);
});
test('notes contain escaped per-play results and a stable recovery marker', () => {
  const body = noteBody(play, comp);
  assert.ok(body.includes('&lt;img src=x&gt;'));
  assert.ok(body.includes('VenueGuessr play: play1'));
  assert.ok(body.includes('100 base points'));
  assert.ok(body.includes('Total score: 200'));
});
test('provider errors never return secret or lead data', async () => {
  const api = makeHubspotClient('private-key', async (url, options) => {
    assert.ok(url.startsWith('https://api.hubapi.com/'));
    assert.equal(options.redirect, 'manual');
    return new Response('private-key person@example.test', { status: 403 });
  });
  await assert.rejects(api('/crm/v3/objects/contacts'), error => error.status === 403 && !error.message.includes('private-key') && !error.message.includes('@'));
});
test('existing segment with a different competition is never repurposed', async () => {
  const api = async path => path.includes('/properties/') ? { type: 'enumeration', fieldType: 'checkbox', options: [] } : { listId: '55', objectTypeId: '0-1', processingType: 'DYNAMIC', filterBranch: segmentBody({ ...comp, id: 'other' }).filterBranch };
  await assert.rejects(syncCompetition(api, {}, comp), /different rules/);
});
test('successful play creates one contact-associated note and subsequent retries create none', async () => {
  const saved = { ...lead }; let notes = 0;
  const entities = { Lead: { update: async (_, patch) => Object.assign(saved, patch) } };
  const api = async (path, method, body) => {
    if (path === '/crm/v3/objects/notes') {
      notes++; assert.equal(body.associations[0].types[0].associationTypeId, 202); return { id: 'n1' };
    }
    return { id: 'contact1', properties: {} };
  };
  await syncPlay(api, entities, saved, play, comp);
  await syncPlay(api, entities, saved, play, comp);
  assert.equal(notes, 1); assert.equal(saved.hubspot_note_id, 'n1');
});
test('ambiguous note creation is recovered without posting a duplicate', async () => {
  const saved = { ...lead }; let attempts = 0;
  const entities = { Lead: { update: async (_, patch) => Object.assign(saved, patch) } };
  const api = async path => {
    if (path === '/crm/v3/objects/notes') { attempts++; throw new HubspotError('timeout'); }
    if (path.includes('/associations/notes')) return { results: [{ id: 'recovered' }] };
    if (path.includes('/notes/batch/read')) return { results: [{ id: 'recovered', properties: { hs_note_body: noteBody(play, comp) } }] };
    return { id: 'contact1', properties: {} };
  };
  await assert.rejects(syncPlay(api, entities, saved, play, comp));
  assert.equal(saved.hubspot_note_state, 'creating');
  await syncPlay(api, entities, saved, play, comp);
  assert.equal(attempts, 1); assert.equal(saved.hubspot_note_id, 'recovered');
});
test('unrecoverable ambiguous note stays flagged and is not re-created', async () => {
  const saved = { ...lead, hubspot_note_state: 'creating' }; let posts = 0;
  const api = async path => {
    if (path === '/crm/v3/objects/notes') posts++;
    if (path.includes('/associations/notes')) return { results: [] };
    return { id: 'contact1', properties: {} };
  };
  await assert.rejects(syncPlay(api, { Lead: { update: async () => {} } }, saved, play, comp), /uncertain/);
  assert.equal(posts, 0);
});
test('explicit HubSpot rejection allows a safe subsequent note retry', async () => {
  const saved = { ...lead };
  const api = async path => {
    if (path === '/crm/v3/objects/notes') throw new HubspotError('rate limited', 429);
    return { id: 'contact1', properties: {} };
  };
  await assert.rejects(syncPlay(api, { Lead: { update: async (_, patch) => Object.assign(saved, patch) } }, saved, play, comp));
  assert.equal(saved.hubspot_note_state, 'pending');
});

const source = await readFile(new URL('../base44/functions/syncHubspot/entry.ts', import.meta.url), 'utf8');
const compiled = ts.transpile(source
  .replace("import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';", 'const createClientFromRequest = () => globalThis.hubspotTestClient;')
  .replace("import { secrets } from 'base44:runtime';", "const secrets = { get: () => 'test-key' };")
  .replace("'./hubspot.js'", JSON.stringify(new URL('../base44/functions/syncHubspot/hubspot.js', import.meta.url).href)), { module: ts.ModuleKind.ESNext });
const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const request = body => new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) });
test('anonymous callers cannot trigger arbitrary contact, competition or queue writes', async () => {
  globalThis.hubspotTestClient = { auth: { me: async () => null }, asServiceRole: { entities: {} } };
  for (const body of [{}, { lead_id: 'l1' }, { competition_id: 'c1' }]) assert.equal((await handler(request(body))).status, 403);
});
test('invalid or incomplete submission tokens do not start provider writes', async () => {
  globalThis.hubspotTestClient = { asServiceRole: { entities: { PendingSubmission: { filter: async () => [{ status: 'pending', lead_id: 'l1' }] } } } };
  assert.equal((await handler(request({ submission_token: 'token' }))).status, 404);
});
test('a lost lock leaves the lead queued and does not release another workers lock', async () => {
  const queries = [];
  globalThis.hubspotTestClient = { auth: { me: async () => ({ role: 'admin' }) }, asServiceRole: { entities: {
    Lead: { get: async () => lead }, PendingSubmission: { filter: async () => [play] },
    Competition: { get: async () => comp, list: async () => [comp], updateMany: async (query) => { queries.push(query); return { updated: 0 }; } },
  } } };
  assert.deepEqual(await (await handler(request({ lead_id: 'l1' }))).json(), { status: 'queued' });
  assert.ok(queries[1].hubspot_lock_id);
});
test('a worker re-reads the lead after taking the lock and skips a completed play', async () => {
  let reads = 0;
  globalThis.hubspotTestClient = { auth: { me: async () => ({ role: 'admin' }) }, asServiceRole: { entities: {
    Lead: { get: async () => ++reads === 1 ? lead : { ...lead, hubspot_status: 'synced' } },
    PendingSubmission: { filter: async () => [play] },
    Competition: { get: async () => comp, list: async () => [comp], updateMany: async () => ({ updated: 1 }) },
  } } };
  assert.deepEqual(await (await handler(request({ lead_id: 'l1' }))).json(), { status: 'synced' });
  assert.equal(reads, 2);
});

test('legacy Base44 timestamps become valid UTC note timestamps', () => {
  assert.equal(noteTimestamp({ created_date: '2026-10-01T16:36:21.550000' }), '2026-10-01T16:36:21.550Z');
  assert.equal(noteTimestamp({ completed_at: '2026-10-01T17:36:21+01:00' }), '2026-10-01T16:36:21.000Z');
  assert.throws(() => noteTimestamp({}), /unavailable/);
});
