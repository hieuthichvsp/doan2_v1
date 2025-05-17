'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('departments', [
            {
                departcode: 'CNTT',
                name: 'Công nghệ thông tin',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                departcode: 'DT',
                name: 'Điện tử viễn thông',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                departcode: 'KT',
                name: 'Kinh tế',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                departcode: 'NN',
                name: 'Ngoại ngữ',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                departcode: 'MT',
                name: 'Môi trường',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('departments', null, {});
    }
};