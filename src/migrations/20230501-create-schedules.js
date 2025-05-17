'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Schedules', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      weekday: { type: Sequelize.TINYINT },
      id_time: {
        type: Sequelize.INTEGER,
        references: { model: 'Times', key: 'id' }
      },
      id_class_session: {
        type: Sequelize.INTEGER,
        references: { model: 'ClassSessions', key: 'id' }
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Schedules');
  }
};