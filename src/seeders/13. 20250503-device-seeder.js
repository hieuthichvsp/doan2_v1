'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('devices', [
            {
                device_code: 'DEV001',
                name: 'Thiết bị điểm danh A101',
                location: 'Tầng 1, Tòa A',
                class_id: 1,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                device_code: 'DEV002',
                name: 'Thiết bị điểm danh A102',
                location: 'Tầng 1, Tòa A',
                class_id: 2,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                device_code: 'DEV003',
                name: 'Thiết bị điểm danh B201',
                location: 'Tầng 2, Tòa B',
                class_id: 3,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                device_code: 'DEV004',
                name: 'Thiết bị điểm danh B202',
                location: 'Tầng 2, Tòa B',
                class_id: 4,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                device_code: 'DEV005',
                name: 'Thiết bị điểm danh LAB01',
                location: 'Tầng 1, Tòa C',
                class_id: 5,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                device_code: 'DEV006',
                name: 'Thiết bị điểm danh LAB02',
                location: 'Tầng 1, Tòa C',
                class_id: 6,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('devices', null, {});
    }
};