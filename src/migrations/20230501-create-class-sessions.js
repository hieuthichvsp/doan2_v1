'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClassSessions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      class_code: { type: Sequelize.STRING(20) },
      name: { type: Sequelize.STRING(100) },
      type: { type: Sequelize.ENUM('LT', 'TH') },
      sub_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Subjects', key: 'id' }
      },
      semester_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Semesters', key: 'id' }
      },
      class_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Classes', key: 'id' }
      },
      capacity: { type: Sequelize.INTEGER },
      teacher_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' }
      },
      start_time: { type: Sequelize.TIME },
      end_time: { type: Sequelize.TIME },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ClassSessions');
  }
};