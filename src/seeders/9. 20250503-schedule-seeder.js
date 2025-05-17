'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('schedules', [
            {
                weekday: 2,
                id_time: 1,
                id_class_session: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                weekday: 4,
                id_time: 2,
                id_class_session: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                weekday: 6,
                id_time: 5,
                id_class_session: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                weekday: 3,
                id_time: 1,
                id_class_session: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                weekday: 5,
                id_time: 5,
                id_class_session: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                weekday: 2,
                id_time: 2,
                id_class_session: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('schedules', null, {});
    }
};