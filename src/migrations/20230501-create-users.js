'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      user_code: { type: Sequelize.STRING(50) },
      name: { type: Sequelize.STRING(100) },
      password: { type: Sequelize.STRING(255) },
      email: { type: Sequelize.STRING(100) },
      birthday: { type: Sequelize.DATE },
      address: { type: Sequelize.STRING(255) },
      role_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Roles', key: 'id' }
      },
      department_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Departments', key: 'id' }
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};