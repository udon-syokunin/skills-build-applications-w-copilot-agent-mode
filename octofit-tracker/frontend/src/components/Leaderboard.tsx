import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Entry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiResource<LeaderboardResponse>('/api/leaderboard');
  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {loading ? <p role="status">Loading leaderboard…</p>
      : error ? <p role="alert">Unable to load leaderboard: {error}</p>
        : data?.leaderboard.length
          ? <ol>{data.leaderboard.map((entry) => <li key={`${entry.rank}-${entry.teamName}`}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>
          : <p>No leaderboard rankings yet.</p>}
  </CapabilityCard>;
}
