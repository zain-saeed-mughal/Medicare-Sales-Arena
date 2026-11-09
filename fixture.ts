export const teams = ['Vanguard', 'Apex', 'Velocity', 'Summit', 'Titan', 'Horizon'];
export const teamColors: Record<string, string> = {
  Vanguard: '#2dd4bf', // Teal
  Apex: '#f59e0b',     // Amber
  Velocity: '#38bdf8', // Sky Blue
  Summit: '#a78bfa',   // Violet
  Titan: '#fb7185',    // Rose
  Horizon: '#34d399',  // Emerald
};
export const teamBadges: Record<string, string> = {
  Vanguard: 'VG',
  Apex: 'AP',
  Velocity: 'VL',
  Summit: 'SM',
  Titan: 'TT',
  Horizon: 'HZ',
};

const teamAssignments = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3];
const approvedCounts = [24, 22, 20, 18, 16, 14, 12, 10, 9, 7];
const submittedCounts = [30, 27, 25, 23, 20, 18, 16, 14, 13, 11];

export const agents = [
  'Jordan Hayes',
  'Maya Brooks',
  'Ethan Cole',
  'Avery Chen',
  'Sofia Reyes',
  'Noah Bennett',
  'Amara Davis',
  'Liam Parker',
  'Zoe Morgan',
  'Owen Blake'
].map((name, i) => ({
  id: i,
  name,
  team: teams[teamAssignments[i]],
  sales: approvedCounts[i],
  approved: approvedCounts[i],
  submitted: submittedCounts[i],
}));

export function rank(list: typeof agents) {
  return [...list].sort((a, b) => b.sales - a.sales || (b.submitted ?? 0) - (a.submitted ?? 0) || a.id - b.id);
}

export function nextApproval(sequence: number) {
  return [2, 2, 2, 1, 4, 0, 3, 5][sequence % 8];
}
