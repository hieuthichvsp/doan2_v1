'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('rfids', [
            {
                code: 'RFID0001',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                code: 'RFID0002',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                code: 'RFID0003',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                code: 'RFID0004',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                code: 'RFID0005',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('rfids', null, {});
    }
};