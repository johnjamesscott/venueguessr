import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Shared email template builder — used by the function and the preview endpoint
function buildEmailHtml({ first_name, total_score, round_results }) {
  const venueRows = (round_results || []).map((r, i) => `
    <tr>
      <td style="padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#cccccc;border-bottom:1px solid #333333;">
        Round ${i + 1} — ${r.venue_name || 'Unknown'}${r.city ? `, ${r.city}` : ''}
      </td>
      <td style="padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#AF231C;text-align:right;border-bottom:1px solid #333333;">
        ${(r.score || 0).toLocaleString()} pts
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
    /* Force light mode — override email client dark mode */
    :root { color-scheme: light only; }
    body { margin:0!important; padding:0!important; background-color:#f4f4f4!important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    /* Prevent Gmail from overriding colors */
    u + .body .hb-wrapper { background-color:#f4f4f4!important; }
    /* Outlook fixes */
    .ExternalClass { width:100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height:100%; }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:#f4f4f4;">

<!-- Preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f4f4;mso-hide:all;">
  You scored ${(total_score || 0).toLocaleString()} pts in VenueGuessr. See your full round breakdown inside.
</div>

<table class="hb-wrapper" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f4f4f4" style="background-color:#f4f4f4;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Outer card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#1a1a1a;border-radius:12px;overflow:hidden;">

        <!-- ═══ HEADER ═══ -->
        <tr>
          <td align="center" bgcolor="#AF231C" style="padding:32px 32px 24px;background-color:#AF231C;">
            <img src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
                 alt="HeadBox" width="130" height="auto"
                 style="display:block;margin:0 auto 16px;border:0;filter:brightness(0) invert(1);" />
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:1px;">
              VenueGuessr
            </p>
          </td>
        </tr>

        <!-- ═══ INTRO ═══ -->
        <tr>
          <td bgcolor="#1a1a1a" style="padding:32px 32px 0;background-color:#1a1a1a;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#ffffff;">
              Hi ${first_name || 'there'},
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#aaaaaa;">
              Thanks for playing VenueGuessr at the HeadBox stand! Here&apos;s a summary of your game.
            </p>
          </td>
        </tr>

        <!-- ═══ SCORE HIGHLIGHT ═══ -->
        <tr>
          <td bgcolor="#1a1a1a" style="padding:24px 32px;background-color:#1a1a1a;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#222222" style="background-color:#222222;border-radius:8px;">
              <tr>
                <td align="center" style="padding:24px 20px;">
                  <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#888888;">
                    Your Total Score
                  </p>
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:52px;font-weight:900;color:#AF231C;line-height:1.1;">
                    ${(total_score || 0).toLocaleString()}
                  </p>
                  <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;">
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
          <td bgcolor="#1a1a1a" style="padding:0 32px 24px;background-color:#1a1a1a;">
            <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ffffff;">
              Round Breakdown
            </p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#222222" style="background-color:#222222;border-radius:8px;overflow:hidden;">
              ${venueRows}
            </table>
          </td>
        </tr>
        ` : ''}

        <!-- ═══ BODY COPY ═══ -->
        <tr>
          <td bgcolor="#1a1a1a" style="padding:0 32px 28px;background-color:#1a1a1a;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#aaaaaa;">
              We&apos;ll be in touch to announce the competition winners. Good luck! 🎯
            </p>
          </td>
        </tr>

        <!-- ═══ CTA BUTTON ═══ -->
        <tr>
          <td bgcolor="#1a1a1a" align="center" style="padding:0 32px 36px;background-color:#1a1a1a;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="#AF231C" style="border-radius:50px;background-color:#AF231C;">
                  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://app.headbox.com/plan-my-event" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" strokecolor="#AF231C" fillcolor="#AF231C"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;">Ready to plan your next event? →</center></v:roundrect><![endif]-->
                  <!--[if !mso]><!-->
                  <a href="https://app.headbox.com/plan-my-event"
                     style="display:inline-block;background-color:#AF231C;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;">
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
          <td bgcolor="#111111" align="center" style="padding:20px 32px;background-color:#111111;border-top:1px solid #2a2a2a;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;">
              &copy; HeadBox &middot;
              <a href="https://www.headbox.com" style="color:#AF231C;text-decoration:none;">headbox.com</a>
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
    const { first_name, last_name, email, total_score, round_results, preview_only } = body;

    // Preview mode — return HTML without sending
    if (preview_only) {
      const html = buildEmailHtml({ first_name: first_name || 'Jane', total_score: total_score || 8750, round_results });
      return Response.json({ html });
    }

    const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY');
    const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY');

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      return Response.json({ error: 'Mailjet credentials not configured' }, { status: 500 });
    }

    const credentials = btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`);
    const htmlBody = buildEmailHtml({ first_name, total_score, round_results });

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
    const msgStatus = sendData?.Messages?.[0]?.Status;

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