'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('participants', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      full_name: { type: Sequelize.STRING(100), allowNull: false },
      // Stored lower-cased; the unique constraint is what guarantees one
      // registration per email across solo entries and every team.
      email: { type: Sequelize.STRING(254), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      organization: { type: Sequelize.STRING(120), allowNull: false },
      role: { type: Sequelize.STRING(80) },
      github_url: { type: Sequelize.STRING(255) },
      registration_type: { type: Sequelize.ENUM('solo', 'team'), allowNull: false },
      // Solo participants pick their own track; team members inherit the team's.
      track: { type: Sequelize.STRING(60) },
      team_id: {
        type: Sequelize.INTEGER,
        references: { model: 'teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      is_team_lead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('participants', ['team_id']);
    await queryInterface.sequelize.query(`
      ALTER TABLE participants ADD CONSTRAINT participants_type_team_check CHECK (
        (registration_type = 'solo' AND team_id IS NULL AND track IS NOT NULL) OR
        (registration_type = 'team' AND team_id IS NOT NULL)
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('participants');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_participants_registration_type";');
  },
};
