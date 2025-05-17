'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('classsessions', [
            {
                class_code: 'COMP101-01',
                name: 'Nhập môn lập trình - Nhóm 01',
                type: 'LT',
                sub_id: 1,
                semester_id: 1,
                class_id: 1,
                capacity: 45,
                teacher_id: 1,
                start_time: '07:00:00',
                end_time: '09:30:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_code: 'COMP101-02',
                name: 'Nhập môn lập trình - Nhóm 02',
                type: 'LT',
                sub_id: 1,
                semester_id: 1,
                class_id: 2,
                capacity: 35,
                teacher_id: 1,
                start_time: '09:45:00',
                end_time: '12:15:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_code: 'COMP101-TH01',
                name: 'Nhập môn lập trình - Thực hành 01',
                type: 'TH',
                sub_id: 1,
                semester_id: 1,
                class_id: 5,
                capacity: 25,
                teacher_id: 1,
                start_time: '12:30:00',
                end_time: '16:15:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_code: 'COMP201-01',
                name: 'Cấu trúc dữ liệu và giải thuật - Nhóm 01',
                type: 'LT',
                sub_id: 2,
                semester_id: 1,
                class_id: 3,
                capacity: 30,
                teacher_id: 2,
                start_time: '07:00:00',
                end_time: '09:30:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_code: 'COMP201-TH01',
                name: 'Cấu trúc dữ liệu và giải thuật - Thực hành 01',
                type: 'TH',
                sub_id: 2,
                semester_id: 1,
                class_id: 6,
                capacity: 25,
                teacher_id: 2,
                start_time: '07:00:00',
                end_time: '10:45:00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                class_code: 'ELEC101-01',
                name: 'Mạch điện cơ bản - Nhóm 01',
                type: 'LT',
                sub_id: 5,
                semester_id: 1,
                class_id: 4,
                capacity: 30,
                teacher_id: 3,
                start_time: '09:45:00',
                end_time: '12:15:00',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('classsessions', null, {});
    }
};