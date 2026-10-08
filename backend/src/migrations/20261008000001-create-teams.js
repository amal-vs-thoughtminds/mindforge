'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teams', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(60), allowNull: false },
      track: { type: Sequelize.STRING(60), allowNull: false },
      project_idea: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    // Team names are unique regardless of letter case ("Byte Me" == "byte me").
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX teams_name_lower_unique ON teams (LOWER(name));'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teams');
  },
};
