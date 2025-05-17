'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Classes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      room_code: { type: Sequelize.STRING(20) },
      name: { type: Sequelize.STRING(100) },
      capacity: { type: Sequelize.INTEGER },
      type: { type: Sequelize.ENUM('LT', 'TH') },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Classes');
  }
};