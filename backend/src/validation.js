const { z } = require('zod');
const event = require('./config/event');

const trimmed = (max) => z.string().trim().min(1, 'Required').max(max);
const optional = (schema) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional());

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

const member = z.object({
  fullName: trimmed(100).min(2, 'Name is too short'),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
  organization: trimmed(120),
  role: optional(z.string().trim().max(80)),
  githubUrl: optional(
    z.string().trim().url('Enter a valid URL').max(255).regex(/^https?:\/\//, 'URL must start with http(s)://')
  ),
});

const track = z.enum(event.tracks, { errorMap: () => ({ message: 'Choose a track' }) });
const agreed = z.literal(true, { errorMap: () => ({ message: 'You must accept the rules' }) });

const soloSchema = z.object({ participant: member, track, agreeToRules: agreed });

const teamSchema = z
  .object({
    teamName: trimmed(60).min(2, 'Team name is too short'),
    track,
    projectIdea: optional(z.string().trim().max(1000)),
    members: z
      .array(member)
      .min(event.minTeamSize, `A team needs at least ${event.minTeamSize} members`)
      .max(event.maxTeamSize, `A team can have at most ${event.maxTeamSize} members`),
    agreeToRules: agreed,
  })
  .superRefine((data, ctx) => {
    const seen = new Map();
    data.members.forEach((m, i) => {
      if (seen.has(m.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['members', i, 'email'],
          message: `Same email as member ${seen.get(m.email) + 1}`,
        });
      } else {
        seen.set(m.email, i);
      }
    });
  });

// Flattens zod issues to { "members.1.email": "message" } for the form.
function formatErrors(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

module.exports = { soloSchema, teamSchema, email, formatErrors };
