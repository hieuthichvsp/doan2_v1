'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendances', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      attendance_session_id: {
        type: Sequelize.INTEGER,
        references: { model: 'AttendanceSessions', key: 'id' }
      },
      student_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' }
      },
      checkin_time: { type: Sequelize.DATE },
      status: {
        type: Sequelize.ENUM('Đúng giờ', 'Muộn', 'Vắng'),
        defaultValue: 'Vắng'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Attendances');
  }
};