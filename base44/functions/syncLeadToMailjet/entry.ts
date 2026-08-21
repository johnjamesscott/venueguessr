import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const leadId = typeof body?.lead_id === 'string' ? body.lead_id.trim() : '';
    const submissionToken = typeof body?.submission_token === 'string'
      ? body.submission_token.trim().slice(0, 100)
      : '';
    let resolvedLeadId = leadId;

    if (submissionToken) {
      const submissions = await base44.asServiceRole.entities.PendingSubmission.filter({ token: submissionToken });
      const submission = submissions[0];
      if (!submission || submission.status !== 'completed' || !submission.lead_id) {
        return Response.json({ error: 'Completed score submission not found' }, { status: 404 });
      }
      resolvedLeadId = submission.lead_id;
    } else {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    if (!resolvedLeadId) {
      return Response.json({ error: 'lead_id or submission_token is required' }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: resolvedLeadId });
    const lead = leads[0];
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    if (lead.mailjet_synced === true) {
      return Response.json({ success: true, already_synced: true });
    }
    if (lead.consent !== true) {
      return Response.json({ error: 'Lead has not consented to contact' }, { status: 403 });
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

    let contactData = await contactRes.json();
    // Mailjet can return 400 when the contact already exists. The contact-data
    // update below remains the authoritative sync step for that case.
    if (!contactRes.ok && contactRes.status !== 400) {
      console.error('Mailjet contact sync failed:', contactRes.status);
      return Response.json({ error: 'Mailjet contact sync failed' }, { status: 502 });
    }
    if (contactRes.status === 400) {
      const existingContactRes = await fetch(
        `https://api.mailjet.com/v3/REST/contact/${encodeURIComponent(lead.email)}`,
        { headers: { 'Authorization': `Basic ${credentials}` } },
      );
      if (!existingContactRes.ok) {
        console.error('Mailjet existing contact lookup failed:', existingContactRes.status);
        return Response.json({ error: 'Mailjet contact lookup failed' }, { status: 502 });
      }
      contactData = await existingContactRes.json();
    }

    // Update contact properties
    const contactDataRes = await fetch(`https://api.mailjet.com/v3/REST/contactdata/${encodeURIComponent(lead.email)}`, {
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
    if (!contactDataRes.ok) {
      console.error('Mailjet contact property sync failed:', contactDataRes.status);
      return Response.json({ error: 'Mailjet contact property sync failed' }, { status: 502 });
    }

    // Add to list if configured
    if (MAILJET_LIST_ID) {
      const contactId = contactData.Data?.[0]?.ID;
      if (!contactId) {
        return Response.json({ error: 'Mailjet contact ID was unavailable' }, { status: 502 });
      }
      const listRes = await fetch('https://api.mailjet.com/v3/REST/listrecipient', {
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
      if (!listRes.ok && listRes.status !== 400) {
        console.error('Mailjet list sync failed:', listRes.status);
        return Response.json({ error: 'Mailjet list sync failed' }, { status: 502 });
      }
    }

    // Mark as synced
    await base44.asServiceRole.entities.Lead.update(resolvedLeadId, { mailjet_synced: true });

    return Response.json({ success: true });
  } catch (error) {
    console.error('syncLeadToMailjet failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not sync the lead to Mailjet' }, { status: 500 });
  }
});
