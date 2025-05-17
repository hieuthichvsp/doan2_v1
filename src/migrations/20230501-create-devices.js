'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Devices', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      device_code: {
        type: Sequelize.STRING(50),
        unique: true
      },
      name: { type: Sequelize.STRING(100) },
      location: { type: Sequelize.STRING(255) },
      class_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Classes', key: 'id' }
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Devices');
  }
};