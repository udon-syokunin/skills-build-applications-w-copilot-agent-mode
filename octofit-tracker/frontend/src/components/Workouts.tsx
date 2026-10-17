import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Workout = { title: string; focus?: string; minutes?: number; reason?: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const email = 'mona@example.com';
  const { data, loading, error } = useApiResource<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
    {loading ? <p role="status">Loading workout suggestions…</p>
      : error ? <p role="alert">Unable to load workout suggestions: {error}</p>
        : data?.suggestions.length
          ? <ul>{data.suggestions.map((workout, index) => <li key={`${workout.title}-${index}`}>
            <strong>{workout.title}</strong>{workout.focus ? ` — ${workout.focus}` : ''}
            {workout.minutes ? `, ${workout.minutes} minutes` : ''}
            {workout.reason ? <p>{workout.reason}</p> : null}
          </li>)}</ul>
          : <p>No workout suggestions available.</p>}
  </CapabilityCard>;
}
