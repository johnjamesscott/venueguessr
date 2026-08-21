import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const EMPTY_LEADERBOARD = {
  competition: null,
  entries: [],
  prizes: [],
};

async function fetchPublicLeaderboard(competitionId) {
  const response = await base44.functions.invoke('getPublicLeaderboard', {
    competition_id: competitionId || null,
  });
  const data = response?.data;

  if (!data || data.error) {
    throw new Error(data?.error || 'Leaderboard unavailable');
  }

  return data;
}

export function usePublicLeaderboard({ competitionId = null, enabled = true } = {}) {
  return useQuery({
    queryKey: ['public-leaderboard', competitionId || 'active'],
    queryFn: () => fetchPublicLeaderboard(competitionId),
    enabled,
    staleTime: 30_000,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export { EMPTY_LEADERBOARD };
