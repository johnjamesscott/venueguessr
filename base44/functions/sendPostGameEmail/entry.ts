import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const cleanText = (value, maxLength) => (
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
);

const escapeHtml = (value) => cleanText(value, 200)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const safeScore = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
};

// Shared email template builder — used by the function and the preview endpoint
// HeadBox design system: Montserrat, white card on light-neutral, #4A4C49 body, #AF231C accents only.
function buildEmailHtml({ first_name, total_score, round_results }) {
  const FONT = "'Montserrat',Arial,Helvetica,sans-serif";
  const safeFirstName = escapeHtml(first_name) || 'there';
  const safeTotalScore = safeScore(total_score);

  const venueRows = (round_results || []).map((r, i) => `
    <tr>
      <td style="padding:14px 20px;font-family:${FONT};font-size:14px;color:#4A4C49;border-bottom:1px solid #ececec;">
        <span style="font-weight:600;color:#1a1a1a;">Round ${i + 1}</span><br/>
        ${escapeHtml(r.venue_name) || 'Unknown'}${r.city ? ` &middot; ${escapeHtml(r.city)}` : ''}
      </td>
      <td style="padding:14px 20px;font-family:${FONT};font-size:14px;font-weight:700;color:#1a1a1a;text-align:right;border-bottom:1px solid #ececec;vertical-align:top;white-space:nowrap;">
        ${safeScore(r.score).toLocaleString()} pts
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Your VenueGuessr Results</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    :root { color-scheme: light only; }
    body { margin:0!important; padding:0!important; background-color:#f7f7f6!important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    u + .body .hb-wrapper { background-color:#f7f7f6!important; }
    .ExternalClass { width:100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height:100%; }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:#f7f7f6;">

<!-- Preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f7f7f6;mso-hide:all;">
  You scored ${safeTotalScore.toLocaleString()} pts in VenueGuessr. See your full round breakdown inside.
</div>

<table class="hb-wrapper" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f7f7f6" style="background-color:#f7f7f6;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Outer card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ececec;">

        <!-- ═══ HEADER ═══ -->
        <tr>
          <td align="center" bgcolor="#ffffff" style="padding:36px 32px 28px;background-color:#ffffff;border-bottom:3px solid #AF231C;">
            <img src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
                 alt="HeadBox" width="120" height="auto"
                 style="display:block;margin:0 auto 14px;border:0;" />
            <p style="margin:0;font-family:${FONT};font-size:13px;font-weight:700;color:#AF231C;letter-spacing:2px;text-transform:uppercase;">
              VenueGuessr
            </p>
          </td>
        </tr>

        <!-- ═══ INTRO ═══ -->
        <tr>
          <td bgcolor="#ffffff" style="padding:32px 32px 0;background-color:#ffffff;">
            <p style="margin:0 0 8px;font-family:${FONT};font-size:20px;font-weight:700;color:#1a1a1a;">
              Hi ${safeFirstName},
            </p>
            <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.7;color:#4A4C49;">
              Thanks for playing VenueGuessr at the HeadBox stand! Here&apos;s a summary of your game.
            </p>
          </td>
        </tr>

        <!-- ═══ SCORE HIGHLIGHT ═══ -->
        <tr>
          <td bgcolor="#ffffff" style="padding:24px 32px;background-color:#ffffff;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fbf4f3" style="background-color:#fbf4f3;border-radius:12px;border:1px solid #f0d9d7;">
              <tr>
                <td align="center" style="padding:28px 20px;">
                  <p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#AF231C;">
                    Your Total Score
                  </p>
                  <p style="margin:0;font-family:${FONT};font-size:52px;font-weight:900;color:#1a1a1a;line-height:1.1;">
                    ${safeTotalScore.toLocaleString()}
                  </p>
                  <p style="margin:6px 0 0;font-family:${FONT};font-size:13px;color:#7a7c78;">
                    points
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══ ROUND BREAKDOWN ═══ -->
        ${venueRows ? `
        <tr>
          <td bgcolor="#ffffff" style="padding:0 32px 24px;background-color:#ffffff;">
            <p style="margin:0 0 12px;font-family:${FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#4A4C49;">
              Round Breakdown
            </p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px;border:1px solid #ececec;overflow:hidden;">
              ${venueRows}
            </table>
          </td>
        </tr>
        ` : ''}

        <!-- ═══ BODY COPY ═══ -->
        <tr>
          <td bgcolor="#ffffff" style="padding:0 32px 28px;background-color:#ffffff;">
            <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.7;color:#4A4C49;">
              We&apos;ll be in touch to announce the competition winners. Good luck! 🎯
            </p>
          </td>
        </tr>

        <!-- ═══ CTA BUTTON ═══ -->
        <tr>
          <td bgcolor="#ffffff" align="center" style="padding:0 32px 36px;background-color:#ffffff;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="#AF231C" style="border-radius:50px;background-color:#AF231C;">
                  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://app.headbox.com/plan-my-event" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" strokecolor="#AF231C" fillcolor="#AF231C"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;">Ready to plan your next event? &rarr;</center></v:roundrect><![endif]-->
                  <!--[if !mso]><!-->
                  <a href="https://app.headbox.com/plan-my-event"
                     style="display:inline-block;background-color:#AF231C;color:#ffffff;font-family:${FONT};font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;">
                    Ready to plan your next event? &rarr;
                  </a>
                  <!--<![endif]-->
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══ FOOTER ═══ -->
        <tr>
          <td bgcolor="#fafafa" align="center" style="padding:20px 32px;background-color:#fafafa;border-top:1px solid #ececec;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-family:${FONT};font-size:12px;color:#8a8c88;">
              &copy; HeadBox &middot;
              <a href="https://www.headbox.com" style="color:#AF231C;text-decoration:none;font-weight:600;">headbox.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { preview_only } = body;

    // Preview mode is restricted to authenticated admins because it exposes the
    // exact internal email template used by the live app.
    if (preview_only) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
      const html = buildEmailHtml({
        first_name: body?.first_name || 'Jane',
        total_score: body?.total_score || 8750,
        round_results: Array.isArray(body?.round_results) ? body.round_results.slice(0, 3) : [],
      });
      return Response.json({ html });
    }

    const submissionToken = cleanText(body?.submission_token, 100);
    if (!submissionToken) {
      return Response.json({ error: 'submission_token is required' }, { status: 400 });
    }

    const pending = await base44.asServiceRole.entities.PendingSubmission.filter({ token: submissionToken });
    const submission = pending[0];
    if (!submission || submission.status !== 'completed' || !submission.lead_id) {
      return Response.json({ error: 'Completed score submission not found' }, { status: 404 });
    }
    if (submission.email_sent === true) {
      return Response.json({ success: true, already_sent: true });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(submission.lead_id).catch(() => null);
    if (!lead?.email) {
      return Response.json({ error: 'Submission lead not found' }, { status: 404 });
    }

    const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY');
    const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY');

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      return Response.json({ error: 'Mailjet credentials not configured' }, { status: 500 });
    }

    const credentials = btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`);
    const totalScore = safeScore(submission.total_score);
    const htmlBody = buildEmailHtml({
      first_name: lead.first_name,
      total_score: totalScore,
      round_results: submission.round_results || [],
    });

    const sendRes = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: 'noreply@headbox.com', Name: 'HeadBox' },
          To: [{ Email: lead.email, Name: `${cleanText(lead.first_name, 80)} ${cleanText(lead.last_name, 80)}`.trim() }],
          Subject: `You scored ${totalScore.toLocaleString()} pts in VenueGuessr 🎯`,
          HTMLPart: htmlBody,
        }],
      }),
    });

    const sendData = await sendRes.json();
    const msgStatus = sendData?.Messages?.[0]?.Status;

    if (!sendRes.ok || msgStatus === 'error') {
      console.error('Mailjet send failed:', sendRes.status, msgStatus || 'unknown status');
      return Response.json({ error: 'Post-game email could not be sent' }, { status: 502 });
    }

    await base44.asServiceRole.entities.PendingSubmission.update(submission.id, { email_sent: true });
    return Response.json({ success: true });
  } catch (error) {
    console.error('sendPostGameEmail failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Post-game email could not be sent' }, { status: 500 });
  }
});
