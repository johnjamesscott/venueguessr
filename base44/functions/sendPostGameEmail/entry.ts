import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { first_name, last_name, email, total_score, round_results } = body;

    // round_results: [{ venue_name: string, city: string, score: number, distance_km: number }]

    const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY');
    const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY');

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      return Response.json({ error: 'Mailjet credentials not configured' }, { status: 500 });
    }

    const credentials = btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`);

    // Build venue rows HTML
    const venueRows = (round_results || []).map((r, i) => `
      <tr>
        <td style="padding: 10px 16px; color: #888; font-size: 14px; border-bottom: 1px solid #2a2a2a;">Round ${i + 1} — ${r.venue_name}${r.city ? `, ${r.city}` : ''}</td>
        <td style="padding: 10px 16px; color: #AF231C; font-size: 14px; font-weight: 700; text-align: right; border-bottom: 1px solid #2a2a2a;">${(r.score || 0).toLocaleString()} pts</td>
      </tr>
    `).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#121212; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#121212; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#1a1a1a; border-radius:12px; overflow:hidden; border:1px solid #2a2a2a;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#AF231C; padding: 32px; text-align:center;">
              <img src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
                   alt="HeadBox" width="140" style="filter: brightness(0) invert(1); display:block; margin:0 auto 16px;">
              <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:900; letter-spacing:1px;">VenueGuessr</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin:0 0 8px; color:#ffffff; font-size:18px; font-weight:700;">Hi ${first_name},</p>
              <p style="margin:0 0 24px; color:#aaaaaa; font-size:15px; line-height:1.6;">
                Thanks for visiting HeadBox at The Business Travel Show.
              </p>

              <!-- Score highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#222; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:20px; text-align:center;">
                    <p style="margin:0 0 4px; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:2px; font-weight:700;">Your Total Score</p>
                    <p style="margin:0; color:#AF231C; font-size:48px; font-weight:900;">${(total_score || 0).toLocaleString()}</p>
                    <p style="margin:4px 0 0; color:#555; font-size:12px;">points in VenueGuessr</p>
                  </td>
                </tr>
              </table>

              <!-- Round breakdown -->
              ${venueRows ? `
              <p style="margin:0 0 12px; color:#ffffff; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Round Breakdown</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#222; border-radius:8px; margin-bottom:24px; overflow:hidden;">
                ${venueRows}
              </table>
              ` : ''}

              <p style="margin:0 0 32px; color:#aaaaaa; font-size:15px; line-height:1.6;">
                We'll let the winners of the competition know the results next week!
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.headbox.com/plan-my-event"
                       style="display:inline-block; background:#AF231C; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:16px 40px; border-radius:50px; letter-spacing:0.5px;">
                      Ready to plan your next event? →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px; border-top:1px solid #2a2a2a; text-align:center;">
              <p style="margin:0; color:#555; font-size:12px;">
                © HeadBox · <a href="https://www.headbox.com" style="color:#AF231C; text-decoration:none;">headbox.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const sendRes = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: 'noreply@headbox.com', Name: 'HeadBox' },
          To: [{ Email: email, Name: `${first_name} ${last_name}`.trim() }],
          Subject: `You scored ${(total_score || 0).toLocaleString()} pts in VenueGuessr 🎯`,
          HTMLPart: htmlBody,
        }],
      }),
    });

    const sendData = await sendRes.json();

    // Check for message-level errors (Mailjet returns 200 even on soft failures)
    const msgStatus = sendData?.Messages?.[0]?.Status;
    const msgErrors = sendData?.Messages?.[0]?.Errors;

    if (!sendRes.ok || msgStatus === 'error') {
      console.error('Mailjet send failed:', JSON.stringify(sendData));
      return Response.json({ error: 'Mailjet send failed', detail: sendData }, { status: 500 });
    }

    console.log('Mailjet send response:', JSON.stringify(sendData));
    return Response.json({ success: true, mailjet: sendData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});