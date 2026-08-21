import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const MAX_ROUNDS = 3;
const MAX_BASE_ROUND_SCORE = 5_000;
const ICP_BOOST_FACTOR = 1.25;

const clampNumber = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
};

const cleanText = (value, maxLength) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { competition_id, round_results, icp_boosted } = body;
    const boosted = icp_boosted === true;

    const sanitizedRounds = Array.isArray(round_results)
      ? round_results.slice(0, MAX_ROUNDS).map((round) => {
        const baseScore = Math.round(clampNumber(round?.score, 0, MAX_BASE_ROUND_SCORE));
        return {
          venue_name: cleanText(round?.venue_name, 120) || 'Unknown Venue',
          city: cleanText(round?.city, 80),
          score: boosted ? Math.round(baseScore * ICP_BOOST_FACTOR) : baseScore,
          distance_km: clampNumber(round?.distance_km, 0, 20_000),
        };
      })
      : [];

    if (sanitizedRounds.length === 0) {
      return Response.json({ error: 'At least one round result is required' }, { status: 400 });
    }

    const competitions = await base44.asServiceRole.entities.Competition.filter({ active: true });
    const activeCompetition = competitions[0] || null;
    const requestedCompetitionId = cleanText(competition_id, 100);
    const resolvedCompetitionId = activeCompetition?.id === requestedCompetitionId
      ? requestedCompetitionId
      : activeCompetition?.id || null;

    const totalScore = sanitizedRounds.reduce((sum, round) => sum + round.score, 0);
    const avgDistance = sanitizedRounds.reduce((sum, round) => sum + round.distance_km, 0)
      / sanitizedRounds.length;

    const token = crypto.randomUUID();

    const rec = await base44.asServiceRole.entities.PendingSubmission.create({
      token,
      competition_id: resolvedCompetitionId,
      total_score: totalScore,
      round_results: sanitizedRounds,
      avg_distance_km: Math.round(avgDistance),
      status: 'pending',
      icp_boosted: boosted,
      email_sent: false,
    });

    return Response.json({ token, id: rec.id });
  } catch (error) {
    console.error('createPendingSubmission failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not create the score submission' }, { status: 500 });
  }
});
