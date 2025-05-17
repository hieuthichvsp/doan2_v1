'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('times', [
            {
                start_time: '07:00:00',
                end_time: '09:30:00',
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                start_time: '09:45:00',
                end_time: '12:15:00',
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                start_time: '12:30:00',
                end_time: '15:00:00',
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                start_time: '15:15:00',
                end_time: '17:45:00',
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                start_time: '07:00:00',
                end_time: '10:45:00',
                type: 'TH',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                start_time: '12:30:00',
                end_time: '16:15:00',
                type: 'TH',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('times', null, {});
    }
};