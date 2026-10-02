export const PROPERTY = 'venueguessr_competition';
export const optionValue = (competition) => `competition_${competition.id}`;
export function competitionLabel(competition) {
  const date = competition.start_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error('Set a valid competition start date before syncing.');
  }
  return `${String(competition.name).trim()} — ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(2, 4)}`;
}
export function segmentBody(competition) {
  return {
    name: `VenueGuessr — ${competitionLabel(competition)}`,
    objectTypeId: '0-1', processingType: 'DYNAMIC',
    filterBranch: { filterBranchType: 'OR', filters: [], filterBranches: [{
      filterBranchType: 'AND', filterBranches: [], filters: [{
        filterType: 'PROPERTY', property: PROPERTY,
        operation: { operationType: 'ENUMERATION', operator: 'IS_ANY_OF', values: [optionValue(competition)], includeObjectsWithNoValueSet: false },
      }],
    }] },
  };
}
export function mergeOptions(existing, competition) {
  const value = optionValue(competition);
  const option = { label: competitionLabel(competition), value, hidden: false };
  return [...existing.filter(item => item.value !== value), { ...existing.find(item => item.value === value), ...option }];
}
export function contactProperties(lead, competition, existing = null) {
  const properties = { [PROPERTY]: `;${optionValue(competition)}` };
  if (!existing) properties.email = String(lead.email).trim().toLowerCase();
  for (const [target, source] of [['firstname', 'first_name'], ['lastname', 'last_name'], ['company', 'company']]) {
    if (!existing?.[target] && lead[source]) properties[target] = String(lead[source]).slice(0, 150);
  }
  return properties;
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const noteMarker = submission => `VenueGuessr play: ${submission.id}`;
export function noteBody(submission, competition) {
  const rounds = (submission.round_results || []).slice(0, 5).map((round, index) =>
    `<li>Round ${index + 1}: ${escape(round.venue_name)} (${escape(round.city)}) — ${Number(round.score) || 0} base points; ${Number(round.distance_km || 0).toFixed(1)} km away</li>`).join('');
  return `<h3>VenueGuessr — game results</h3><p>Competition: ${escape(competitionLabel(competition))}<br>Played: ${escape(submission.completed_at || submission.created_date)}<br>Total score: ${Number(submission.total_score) || 0}<br>ICP bonus applied: ${submission.icp_boosted ? 'Yes' : 'No'}<br>Average distance: ${Number(submission.avg_distance_km || 0).toFixed(1)} km</p><ol>${rounds}</ol><p>${escape(noteMarker(submission))}</p>`;
}

export class HubspotError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}
export function makeHubspotClient(key, fetcher = fetch, beforeWrite = () => {}) {
  return async function api(path, method = 'GET', body = undefined) {
    if (method !== 'GET') beforeWrite();
    let response;
    try {
      response = await fetcher(`https://api.hubapi.com${path}`, {
        method, redirect: 'manual', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (_) { throw new HubspotError('HubSpot connection timed out. Retry later.'); }
    if (!response.ok) {
      // Never return provider bodies: these can contain personal data or credentials.
      throw new HubspotError(response.status === 401 || response.status === 403
        ? 'HubSpot access denied. Check the app secret and scopes.'
        : response.status === 429 ? 'HubSpot is busy. Retry later.' : `HubSpot request failed (${response.status}).`, response.status);
    }
    return response.status === 204 ? {} : response.json();
  };
}
export async function optional(api, path) {
  try { return await api(path); } catch (error) { if (error.status === 404) return null; throw error; }
}

export async function syncCompetition(api, entities, competition) {
  const desired = segmentBody(competition);
  const path = `/crm/v3/properties/contacts/${PROPERTY}`;
  let property = await optional(api, path);
  if (!property) {
    await api('/crm/v3/properties/contacts', 'POST', {
      name: PROPERTY, label: 'VenueGuessr Competition', type: 'enumeration', fieldType: 'checkbox',
      groupName: 'contactinformation', options: mergeOptions([], competition),
    });
  } else {
    if (property.type !== 'enumeration' || property.fieldType !== 'checkbox') throw new Error('VenueGuessr Competition must be a multiple-checkbox property.');
    await api(path, 'PATCH', { options: mergeOptions(property.options || [], competition) });
  }
  let list = competition.hubspot_list_id
    ? await optional(api, `/crm/v3/lists/${encodeURIComponent(competition.hubspot_list_id)}?includeFilters=true`)
    : await optional(api, `/crm/v3/lists/object-type-id/0-1/name/${encodeURIComponent(desired.name)}?includeFilters=true`);
  list = list?.list || list;
  if (list) {
    const filters = list.filterBranch?.filterBranches;
    // Refuse to repurpose a same-name segment belonging to another competition.
    if (list.processingType !== 'DYNAMIC' || list.objectTypeId !== '0-1' || filters?.length !== 1 ||
      filters[0].filters?.length !== 1 || filters[0].filters[0].property !== PROPERTY ||
      filters[0].filters[0].operation?.values?.join() !== optionValue(competition)) {
      throw new Error('An existing HubSpot segment has different rules. Review it before syncing.');
    }
    if (list.name !== desired.name) await api(`/crm/v3/lists/${list.listId}/update-list-name?listName=${encodeURIComponent(desired.name)}`, 'PUT');
  } else {
    const result = await api('/crm/v3/lists', 'POST', desired);
    list = result.list || result;
  }
  if (!list.listId) throw new Error('HubSpot did not return a segment ID.');
  await entities.Competition.update(competition.id, { hubspot_list_id: String(list.listId), hubspot_status: 'synced', hubspot_error: '' });
}

export async function syncPlay(api, entities, lead, submission, competition) {
  const contactPath = `/crm/v3/objects/contacts/${encodeURIComponent(String(lead.email).trim().toLowerCase())}?idProperty=email&properties=firstname,lastname,company,${PROPERTY}`;
  let contact = await optional(api, contactPath);
  if (!contact) {
    try { contact = await api('/crm/v3/objects/contacts', 'POST', { properties: contactProperties(lead, competition) }); }
    catch (error) {
      if (error.status !== 409) throw error;
      contact = await api(contactPath);
    }
  }
  await api(`/crm/v3/objects/contacts/${contact.id}`, 'PATCH', { properties: contactProperties(lead, competition, contact.properties) });
  await entities.Lead.update(lead.id, { hubspot_contact_id: String(contact.id) });
  if (lead.hubspot_note_id) return;

  // A previous ambiguous POST must never be blindly repeated. Recover a note
  // using its unique play marker, or leave the lead flagged for manual review.
  if (lead.hubspot_note_state === 'creating') {
    let after = '';
    for (let page = 0; page < 20; page++) {
      const links = await api(`/crm/v3/objects/contacts/${contact.id}/associations/notes?limit=100${after ? `&after=${encodeURIComponent(after)}` : ''}`);
      if (links.results?.length) {
        const notes = await api('/crm/v3/objects/notes/batch/read', 'POST', { properties: ['hs_note_body'], inputs: links.results.map(item => ({ id: item.id })) });
        const found = notes.results?.find(note => note.properties?.hs_note_body?.includes(`${noteMarker(submission)}<`));
        if (found) {
          await entities.Lead.update(lead.id, { hubspot_note_id: String(found.id), hubspot_note_state: 'created' });
          return;
        }
      }
      after = links.paging?.next?.after;
      if (!after) break;
    }
    throw new Error('Note delivery is uncertain. Check the contact in HubSpot before creating another note.');
  }
  await entities.Lead.update(lead.id, { hubspot_note_state: 'creating' });
  let note;
  try {
    note = await api('/crm/v3/objects/notes', 'POST', {
      properties: { hs_timestamp: submission.completed_at || submission.created_date, hs_note_body: noteBody(submission, competition) },
      associations: [{ to: { id: contact.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }],
    });
  } catch (error) {
    // Explicit rejection did not create a note. Timeout/5xx remain ambiguous.
    if (error.status >= 400 && error.status < 500) await entities.Lead.update(lead.id, { hubspot_note_state: 'pending' });
    throw error;
  }
  await entities.Lead.update(lead.id, { hubspot_note_id: String(note.id), hubspot_note_state: 'created' });
}
