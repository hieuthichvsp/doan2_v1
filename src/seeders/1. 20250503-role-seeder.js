'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('roles', [
            {
                name: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'teacher',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'student',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('roles', null, {});
    }
};