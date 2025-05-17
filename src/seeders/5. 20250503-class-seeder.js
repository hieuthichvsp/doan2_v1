'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('classes', [
            {
                room_code: 'A101',
                name: 'Phòng A101',
                capacity: 50,
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                room_code: 'A102',
                name: 'Phòng A102',
                capacity: 40,
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                room_code: 'B201',
                name: 'Phòng B201',
                capacity: 30,
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                room_code: 'B202',
                name: 'Phòng B202',
                capacity: 30,
                type: 'LT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                room_code: 'LAB01',
                name: 'Phòng thực hành 01',
                capacity: 25,
                type: 'TH',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                room_code: 'LAB02',
                name: 'Phòng thực hành 02',
                capacity: 25,
                type: 'TH',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('classes', null, {});
    }
};