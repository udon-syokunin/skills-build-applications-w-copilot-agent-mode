import { Activity, Team, User, Workout } from '../models/index.js';

type ActivityInput = {
  userId: string;
  teamId: string;
  type: string;
  minutes: number;
};

type TeamInput = {
  name: string;
  mascot?: string;
  members?: string[];
};

function clientError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function activityFocus(type: string) {
  const normalized = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'cardio'].includes(normalized)) return 'endurance';
  if (['strength', 'weights', 'weight training'].includes(normalized)) return 'strength';
  if (['yoga', 'stretch', 'stretching', 'mobility'].includes(normalized)) return 'mobility';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw clientError('Activity details are required');
  const { userId, teamId, type, minutes } = input as Partial<ActivityInput>;
  if (typeof userId !== 'string' || !userId.trim() || !User.db.base.isValidObjectId(userId)
    || typeof teamId !== 'string' || !teamId.trim() || !Team.db.base.isValidObjectId(teamId)) {
    throw clientError('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !type.trim() || typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw clientError('A valid activity type and positive whole number of minutes are required');
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw clientError('The specified user or team does not exist', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: Math.round(minutes),
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input) || typeof input.name !== 'string' || !input.name.trim()) {
    throw clientError('A team name is required');
  }
  if (input.mascot !== undefined && (typeof input.mascot !== 'string' || !input.mascot.trim())) {
    throw clientError('Mascot must be a non-empty string');
  }
  if (input.members !== undefined && (!Array.isArray(input.members)
    || input.members.some((member) => typeof member !== 'string' || !User.db.base.isValidObjectId(member)))) {
    throw clientError('Members must be valid user IDs');
  }

  const memberIds = (input.members ?? []) as string[];
  if (memberIds.length > 0) {
    const existingCount = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingCount !== new Set(memberIds).size) throw clientError('One or more team members do not exist', 404);
  }
  return Team.create({
    name: input.name.trim(),
    mascot: typeof input.mascot === 'string' ? input.mascot.trim() : input.name.trim(),
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw clientError('No user found for that email address', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocus = activities[0] ? activityFocus(activities[0].type) : undefined;
  const goalHasWorkout = workouts.some((workout) => workout.focus.trim().toLowerCase() === goal);
  const focus = goalHasWorkout ? goal : recentFocus ?? goal;
  const matching = workouts.filter((workout) => workout.focus.trim().toLowerCase() === focus);
  const recommendations = matching.length > 0 ? matching : workouts;

  return recommendations.map((workout) => ({
    ...workout,
    reason: workout.focus.trim().toLowerCase() === goal
      ? `Matches your ${user.fitnessGoal} fitness goal.`
      : recentFocus
        ? `Recommended based on your recent ${activities[0]?.type} activity.`
        : `Recommended to support your ${user.fitnessGoal} fitness goal.`,
  }));
}

export { User };
