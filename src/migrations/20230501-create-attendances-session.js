'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AttendanceSessions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      class_session_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ClassSessions', key: 'id' }
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Schedules', key: 'id' }
      },
      date: { type: Sequelize.DATE },
      start_time: { type: Sequelize.TIME },
      end_time: { type: Sequelize.TIME },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AttendanceSessions');
  }
};