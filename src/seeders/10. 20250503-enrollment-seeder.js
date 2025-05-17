'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('enrollments', [
            {
                id_classsession: 1,
                id_student: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 3,
                id_student: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 1,
                id_student: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 3,
                id_student: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 4,
                id_student: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 5,
                id_student: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 6,
                id_student: 9,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 1,
                id_student: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id_classsession: 3,
                id_student: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('enrollments', null, {});
    }
};