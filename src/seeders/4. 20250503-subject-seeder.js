'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('subjects', [
            {
                sub_code: 'COMP101',
                name: 'Nhập môn lập trình',
                credit: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                sub_code: 'COMP201',
                name: 'Cấu trúc dữ liệu và giải thuật',
                credit: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                sub_code: 'COMP301',
                name: 'Cơ sở dữ liệu',
                credit: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                sub_code: 'COMP401',
                name: 'Lập trình web',
                credit: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                sub_code: 'ELEC101',
                name: 'Mạch điện cơ bản',
                credit: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                sub_code: 'ELEC201',
                name: 'Kỹ thuật điện tử',
                credit: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                sub_code: 'ECON101',
                name: 'Kinh tế vi mô',
                credit: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                sub_code: 'ECON201',
                name: 'Kinh tế vĩ mô',
                credit: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('subjects', null, {});
    }
};