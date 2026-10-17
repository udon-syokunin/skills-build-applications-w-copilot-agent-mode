import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Team = { name: string; mascot?: string; members: unknown[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiResource<TeamResponse>('/api/teams');
  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {loading ? <p role="status">Loading teams…</p>
      : error ? <p role="alert">Unable to load teams: {error}</p>
        : data?.teams.length
          ? <ul>{data.teams.map((team, index) => <li key={`${team.name}-${index}`}>{team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members.length} members</li>)}</ul>
          : <p>No teams yet.</p>}
  </CapabilityCard>;
}
