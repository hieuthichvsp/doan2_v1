'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('attendances', [
            {
                attendance_session_id: 1,
                student_id: 6,
                checkin_time: '2025-01-06 07:05:00',
                status: 'Đúng giờ',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 1,
                student_id: 7,
                checkin_time: '2025-01-06 07:10:00',
                status: 'Đúng giờ',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 1,
                student_id: 10,
                checkin_time: '2025-01-06 07:25:00',
                status: 'Muộn',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 2,
                student_id: 6,
                checkin_time: '2025-01-13 07:03:00',
                status: 'Đúng giờ',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 2,
                student_id: 7,
                checkin_time: '2025-01-13 07:45:00',
                status: 'Muộn',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 2,
                student_id: 10,
                checkin_time: null,
                status: 'Vắng',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 3,
                student_id: 8,
                checkin_time: '2025-01-07 07:01:00',
                status: 'Đúng giờ',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 5,
                student_id: 6,
                checkin_time: '2025-01-10 12:35:00',
                status: 'Đúng giờ',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                attendance_session_id: 5,
                student_id: 7,
                checkin_time: '2025-01-10 12:40:00',
                status: 'Đúng giờ',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('attendances', null, {});
    }
};