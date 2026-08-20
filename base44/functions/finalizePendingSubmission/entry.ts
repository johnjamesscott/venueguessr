import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { waitUntil } from 'base44:runtime';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token, first_name, last_name, email, company } = body;

    if (!token || !email) {
      return Response.json({ error: 'token and email are required' }, { status: 400 });
    }

    const pending = await base44.asServiceRole.entities.PendingSubmission.filter({ token });
    const sub = pending[0];
    if (!sub) {
      return Response.json({ error: 'not found' }, { status: 404 });
    }
    if (sub.status === 'completed') {
      return Response.json({ error: 'already submitted' }, { status: 409 });
    }

    // 1. Create the Lead
    const lead = await base44.asServiceRole.entities.Lead.create({
      competition_id: sub.competition_id || null,
      first_name,
      last_name,
      email,
      company: company || '',
      score: sub.total_score || 0,
      consent: true,
      mailjet_synced: false,
      icp_boosted: sub.icp_boosted === true,
    });

    // 2. Create the LeaderboardEntry + compute rank (reuse submitScore)
    const scoreRes = await base44.asServiceRole.functions.invoke('submitScore', {
      player_name: `${first_name} ${last_name}`.trim(),
      email,
      total_score: sub.total_score || 0,
      rounds_played: (sub.round_results || []).length,
      avg_distance_km: sub.avg_distance_km || 0,
      icp_boosted: sub.icp_boosted === true,
    });
    const position = scoreRes?.data?.position || 0;
    const competition = scoreRes?.data?.competition || null;

    // 3. Fire Mailjet sync + post-game email after the response (best-effort)
    waitUntil(base44.asServiceRole.functions.invoke('syncLeadToMailjet', { lead_id: lead.id }));
    waitUntil(base44.asServiceRole.functions.invoke('sendPostGameEmail', {
      first_name,
      last_name,
      email,
      total_score: sub.total_score || 0,
      round_results: sub.round_results || [],
    }));

    // 4. Mark the pending submission completed (triggers kiosk realtime advance)
    await base44.asServiceRole.entities.PendingSubmission.update(sub.id, { status: 'completed' });

    // 5. Build the leaderboard preview + total for the phone confirmation
    let leaderboard = [];
    let total_entries = 0;
    if (competition) {
      const [top, all] = await Promise.all([
        base44.asServiceRole.entities.LeaderboardEntry.filter({ competition_id: competition.id }, '-total_score', 5),
        base44.asServiceRole.entities.LeaderboardEntry.filter({ competition_id: competition.id }),
      ]);
      leaderboard = top.map(e => ({ player_name: e.player_name, total_score: e.total_score }));
      total_entries = all.length;
    }

    return Response.json({
      success: true,
      position,
      total_entries,
      competition_name: competition?.name || '',
      leaderboard,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});