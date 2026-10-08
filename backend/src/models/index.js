const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const define = { underscored: true };

const Team = sequelize.define(
  'Team',
  {
    name: { type: DataTypes.STRING(60), allowNull: false },
    track: { type: DataTypes.STRING(60), allowNull: false },
    projectIdea: { type: DataTypes.TEXT },
  },
  { ...define, tableName: 'teams' }
);

const Participant = sequelize.define(
  'Participant',
  {
    fullName: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    organization: { type: DataTypes.STRING(120), allowNull: false },
    role: { type: DataTypes.STRING(80) },
    githubUrl: { type: DataTypes.STRING(255) },
    registrationType: { type: DataTypes.ENUM('solo', 'team'), allowNull: false },
    track: { type: DataTypes.STRING(60) },
    isTeamLead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { ...define, tableName: 'participants' }
);

Team.hasMany(Participant, { as: 'members', foreignKey: 'teamId' });
Participant.belongsTo(Team, { as: 'team', foreignKey: 'teamId' });

module.exports = { sequelize, Sequelize, Team, Participant };
