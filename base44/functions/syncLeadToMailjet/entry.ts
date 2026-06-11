import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { lead_id } = body;

    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get competition name if available
    let competitionName = '';
    if (lead.competition_id) {
      const comps = await base44.asServiceRole.entities.Competition.filter({ id: lead.competition_id });
      competitionName = comps[0]?.name || '';
    }

    const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY');
    const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY');
    const MAILJET_LIST_ID = Deno.env.get('MAILJET_LIST_ID');

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      return Response.json({ error: 'Mailjet credentials not configured' }, { status: 500 });
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
        Email: lead.email,
        Name: `${lead.first_name} ${lead.last_name}`.trim(),
        IsExcludedFromCampaigns: false,
      }),
    });

    const contactData = await contactRes.json();

    // Update contact properties
    await fetch(`https://api.mailjet.com/v3/REST/contactdata/${lead.email}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Data: [
          { Name: 'firstname', Value: lead.first_name },
          { Name: 'lastname', Value: lead.last_name },
          { Name: 'company', Value: lead.company || '' },
          { Name: 'venueguessr_score', Value: String(lead.score || 0) },
          { Name: 'venueguessr_competition', Value: competitionName },
        ],
      }),
    });

    // Add to list if configured
    if (MAILJET_LIST_ID) {
      await fetch(`https://api.mailjet.com/v3/REST/listrecipient`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ContactID: contactData.Data?.[0]?.ID,
          ListID: parseInt(MAILJET_LIST_ID),
        }),
      });
    }

    // Mark as synced
    await base44.asServiceRole.entities.Lead.update(lead_id, { mailjet_synced: true });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});