import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { lead_id } = await req.json();

  const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY');
  const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY');
  const MAILJET_LIST_ID = Deno.env.get('MAILJET_LIST_ID');

  if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
    return Response.json({ error: 'Mailjet credentials not configured' }, { status: 500 });
  }

  const lead = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
  const l = Array.isArray(lead) ? lead[0] : lead;
  if (!l) return Response.json({ error: 'Lead not found' }, { status: 404 });

  // Get competition name
  let competitionName = '';
  if (l.competition_id) {
    const comps = await base44.asServiceRole.entities.Competition.filter({ id: l.competition_id });
    competitionName = comps[0]?.name || '';
  }

  const credentials = btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`);

  // Add contact to Mailjet
  const contactRes = await fetch('https://api.mailjet.com/v3/REST/contact', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Email: l.email,
      Name: `${l.first_name} ${l.last_name}`,
      IsExcludedFromCampaigns: false,
    }),
  });

  if (!contactRes.ok && contactRes.status !== 400) {
    const err = await contactRes.text();
    return Response.json({ error: `Mailjet contact error: ${err}` }, { status: 500 });
  }

  // Add to list if configured
  if (MAILJET_LIST_ID) {
    await fetch(`https://api.mailjet.com/v3/REST/listrecipient`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ContactAlt: l.email,
        ListID: parseInt(MAILJET_LIST_ID),
        IsUnsubscribed: false,
      }),
    });
  }

  // Update contact properties
  await fetch(`https://api.mailjet.com/v3/REST/contactdata/${encodeURIComponent(l.email)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Data: [
        { Name: 'firstname', Value: l.first_name },
        { Name: 'lastname', Value: l.last_name },
        { Name: 'company', Value: l.company || '' },
        { Name: 'venueguessr_score', Value: String(l.score || 0) },
        { Name: 'venueguessr_competition', Value: competitionName },
      ],
    }),
  });

  // Mark as synced
  await base44.asServiceRole.entities.Lead.update(l.id, { mailjet_synced: true });

  return Response.json({ success: true });
});