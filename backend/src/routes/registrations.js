const express = require('express');
const { Op, fn, col, where } = require('sequelize');
const { sequelize, Team, Participant } = require('../models');
const { soloSchema, teamSchema, email: emailSchema, formatErrors } = require('../validation');
const event = require('../config/event');
const { teamRegId, soloRegId } = require('../ids');

const router = express.Router();

const registrationClosed = () => Date.now() > new Date(event.registrationDeadline).getTime();

function validate(schema, body, res) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(422).json({ message: 'Please fix the highlighted fields.', fields: formatErrors(parsed.error) });
    return null;
  }
  return parsed.data;
}

async function findTakenEmails(emails, transaction) {
  const rows = await Participant.findAll({
    where: { email: { [Op.in]: emails } },
    attributes: ['email'],
    transaction,
  });
  return rows.map((r) => r.email);
}

async function teamNameTaken(name, transaction) {
  const count = await Team.count({ where: where(fn('LOWER', col('name')), name.toLowerCase()), transaction });
  return count > 0;
}

// Maps DB unique-constraint races (two submissions at the same moment) to the
// same friendly 409s the pre-checks return.
function conflictFromDbError(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return null;
  const constraint = err.parent?.constraint || '';
  if (constraint.startsWith('teams_name')) {
    return { message: 'That team name is already taken.', fields: { teamName: 'Team name already taken' } };
  }
  return { message: 'One of these emails is already registered.' };
}

router.get('/event', (req, res) => {
  res.json({ ...event, registrationOpen: !registrationClosed() });
});

router.get('/stats', async (req, res, next) => {
  try {
    const [participants, teams, solo] = await Promise.all([
      Participant.count(),
      Team.count(),
      Participant.count({ where: { registrationType: 'solo' } }),
    ]);
    res.json({ participants, teams, solo });
  } catch (err) {
    next(err);
  }
});

router.get('/check/email', async (req, res, next) => {
  const parsed = emailSchema.safeParse(req.query.email || '');
  if (!parsed.success) return res.status(422).json({ message: 'Invalid email' });
  try {
    const taken = await findTakenEmails([parsed.data]);
    res.json({ available: taken.length === 0 });
  } catch (err) {
    next(err);
  }
});

router.get('/check/team-name', async (req, res, next) => {
  const name = String(req.query.name || '').trim();
  if (!name) return res.status(422).json({ message: 'Invalid team name' });
  try {
    res.json({ available: !(await teamNameTaken(name)) });
  } catch (err) {
    next(err);
  }
});

router.post('/registrations/solo', async (req, res, next) => {
  if (registrationClosed()) return res.status(403).json({ message: 'Registrations are closed.' });
  const data = validate(soloSchema, req.body, res);
  if (!data) return;

  try {
    const participant = await sequelize.transaction(async (transaction) => {
      if ((await findTakenEmails([data.participant.email], transaction)).length) {
        const e = new Error('taken');
        e.status = 409;
        e.body = {
          message: 'This email is already registered, either solo or in a team.',
          fields: { 'participant.email': 'Already registered' },
        };
        throw e;
      }
      return Participant.create(
        { ...data.participant, registrationType: 'solo', track: data.track },
        { transaction }
      );
    });
    res.status(201).json({
      message: `You're in, ${participant.fullName.split(' ')[0]}!`,
      registrationId: soloRegId(participant.id),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/registrations/team', async (req, res, next) => {
  if (registrationClosed()) return res.status(403).json({ message: 'Registrations are closed.' });
  const data = validate(teamSchema, req.body, res);
  if (!data) return;

  try {
    const team = await sequelize.transaction(async (transaction) => {
      const fields = {};
      const taken = await findTakenEmails(data.members.map((m) => m.email), transaction);
      data.members.forEach((m, i) => {
        if (taken.includes(m.email)) fields[`members.${i}.email`] = 'Already registered solo or in another team';
      });
      if (await teamNameTaken(data.teamName, transaction)) fields.teamName = 'Team name already taken';

      if (Object.keys(fields).length) {
        const e = new Error('conflict');
        e.status = 409;
        e.body = {
          message: taken.length
            ? `Already registered: ${taken.join(', ')}. A person can only be part of one team or register solo once.`
            : 'That team name is already taken.',
          fields,
        };
        throw e;
      }

      const created = await Team.create(
        { name: data.teamName, track: data.track, projectIdea: data.projectIdea },
        { transaction }
      );
      await Participant.bulkCreate(
        data.members.map((m, i) => ({
          ...m,
          registrationType: 'team',
          teamId: created.id,
          isTeamLead: i === 0,
        })),
        { transaction }
      );
      return created;
    });
    res.status(201).json({
      message: `Team ${team.name} is registered!`,
      registrationId: teamRegId(team.id),
    });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err.status && err.body) return res.status(err.status).json(err.body);
  const conflict = conflictFromDbError(err);
  if (conflict) return res.status(409).json(conflict);
  next(err);
});

module.exports = router;
