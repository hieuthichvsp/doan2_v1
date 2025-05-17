'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('attendancesessions', [
            {
                class_session_id: 1,
                schedule_id: 1,
                date: '2025-01-06',
                start_time: '07:00:00',
                end_time: '09:30:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_session_id: 1,
                schedule_id: 1,
                date: '2025-01-13',
                start_time: '07:00:00',
                end_time: '09:30:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_session_id: 4,
                schedule_id: 4,
                date: '2025-01-07',
                start_time: '07:00:00',
                end_time: '09:30:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_session_id: 4,
                schedule_id: 4,
                date: '2025-01-14',
                start_time: '07:00:00',
                end_time: '09:30:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_session_id: 3,
                schedule_id: 3,
                date: '2025-01-10',
                start_time: '12:30:00',
                end_time: '16:15:00',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('attendancesessions', null, {});
    }
};