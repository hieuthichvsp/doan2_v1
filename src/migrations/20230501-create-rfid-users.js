'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RfidUsers', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      rfid_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Rfids', key: 'id' }
      },
      student_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' }
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
    await queryInterface.dropTable('RfidUsers');
  }
};