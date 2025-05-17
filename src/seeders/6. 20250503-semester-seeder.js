'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('semesters', [
            {
                name: 'HK1 (2025-2026)',
                start_time: '2025-01-05',
                end_time: '2025-05-31',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'HK2 (2025-2026)',
                start_time: '2025-06-10',
                end_time: '2025-10-30',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'HK Phụ (2025-2026)',
                start_time: '2026-01-05',
                end_time: '2026-05-31',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('semesters', null, {});
    }
};