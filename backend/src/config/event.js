// Event rules shared by validation and the public /api/event endpoint.
module.exports = {
  minTeamSize: Number(process.env.MIN_TEAM_SIZE || 2),
  maxTeamSize: Number(process.env.MAX_TEAM_SIZE || 4),
  registrationDeadline: process.env.REGISTRATION_DEADLINE || '2026-12-10T23:59:59+05:30',
  tracks: ['GenAI & Agents', 'Data & Analytics', 'Intelligent Automation', 'Open Innovation'],
};
