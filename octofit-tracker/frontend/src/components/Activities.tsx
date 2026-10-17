import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiResource<ActivityResponse>('/api/activities');
  return <CapabilityCard title="Activities" description="Track student activity minutes and points.">
    {loading ? <p role="status">Loading activities…</p>
      : error ? <p role="alert">Unable to load activities: {error}</p>
        : data?.activities.length
          ? <ul>{data.activities.map((activity, index) => <li key={`${activity.type}-${index}`}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>)}</ul>
          : <p>No activities yet.</p>}
  </CapabilityCard>;
}
