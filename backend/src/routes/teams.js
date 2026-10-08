const crypto = require('crypto');
const express = require('express');
const { Team, Participant } = require('../models');
const { teamRegId, soloRegId } = require('../ids');

const router = express.Router();

// Organisers send the ADMIN_TOKEN in `x-admin-token` to also see emails and
// phone numbers. With no ADMIN_TOKEN configured, contact details are never served.
function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN || '';
  const given = req.get('x-admin-token') || '';
  if (!expected || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const PUBLIC_FIELDS = ['id', 'fullName', 'organization', 'role', 'githubUrl', 'isTeamLead', 'track', 'createdAt'];
const memberFields = (admin) => (admin ? [...PUBLIC_FIELDS, 'email', 'phone'] : PUBLIC_FIELDS);

router.get('/admin/verify', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ message: 'Invalid admin key' });
  res.json({ ok: true });
});

router.get('/teams', async (req, res, next) => {
  try {
    const teams = await Team.findAll({
      include: [{ model: Participant, as: 'members', attributes: ['fullName', 'organization', 'isTeamLead'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(
      teams.map((t) => ({
        id: t.id,
        registrationId: teamRegId(t.id),
        name: t.name,
        track: t.track,
        projectIdea: t.projectIdea,
        createdAt: t.createdAt,
        memberCount: t.members.length,
        lead: t.members.find((m) => m.isTeamLead)?.fullName || null,
        organizations: [...new Set(t.members.map((m) => m.organization))],
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/teams/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(404).json({ message: 'Team not found' });
  try {
    const admin = isAdmin(req);
    const team = await Team.findByPk(id, {
      include: [{ model: Participant, as: 'members', attributes: memberFields(admin) }],
      order: [
        [{ model: Participant, as: 'members' }, 'isTeamLead', 'DESC'],
        [{ model: Participant, as: 'members' }, 'id', 'ASC'],
      ],
    });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json({ ...team.toJSON(), registrationId: teamRegId(team.id), admin });
  } catch (err) {
    next(err);
  }
});

router.get('/solo', async (req, res, next) => {
  try {
    const admin = isAdmin(req);
    const people = await Participant.findAll({
      where: { registrationType: 'solo' },
      attributes: memberFields(admin),
      order: [['createdAt', 'DESC']],
    });
    res.json(people.map((p) => ({ ...p.toJSON(), registrationId: soloRegId(p.id) })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
