'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('rfidusers', [
            {
                rfid_id: 1,
                student_id: 6,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                rfid_id: 2,
                student_id: 7,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                rfid_id: 3,
                student_id: 8,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                rfid_id: 4,
                student_id: 9,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                rfid_id: 5,
                student_id: 10,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('rfidusers', null, {});
    }
};