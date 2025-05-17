const bcrypt = require('bcrypt');
'use strict';
const password = bcrypt.hashSync('123', 10);

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('users', [
            // Admin
            {
                user_code: 'ADMIN001',
                name: 'Nguyễn Quản Trị',
                password: password,
                email: 'admin@university.edu.vn',
                birthday: '1985-05-10',
                address: 'Hà Nội',
                role_id: 1,
                department_id: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Giảng viên
            {
                user_code: 'GV001',
                name: 'Trần Văn An',
                password: password,
                email: 'an.tv@university.edu.vn',
                birthday: '1975-03-15',
                address: 'Hà Nội',
                role_id: 2,
                department_id: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                user_code: 'GV002',
                name: 'Nguyễn Thị Bình',
                password: password,
                email: 'binh.nt@university.edu.vn',
                birthday: '1980-07-20',
                address: 'Hà Nội',
                role_id: 2,
                department_id: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                user_code: 'GV003',
                name: 'Phạm Văn Cường',
                password: password,
                email: 'cuong.pv@university.edu.vn',
                birthday: '1978-11-30',
                address: 'Hà Nội',
                role_id: 2,
                department_id: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                user_code: 'GV004',
                name: 'Lê Thị Dung',
                password: password,
                email: 'dung.lt@university.edu.vn',
                birthday: '1982-04-25',
                address: 'Hà Nội',
                role_id: 2,
                department_id: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Sinh viên
            {
                user_code: 'SV001',
                name: 'Đỗ Văn Nam',
                password: password,
                email: 'nam.dv@student.university.edu.vn',
                birthday: '2000-01-15',
                address: 'Hà Nội',
                role_id: 3,
                department_id: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                user_code: 'SV002',
                name: 'Vũ Thị Hoa',
                password: password,
                email: 'hoa.vt@student.university.edu.vn',
                birthday: '2001-03-22',
                address: 'Bắc Ninh',
                role_id: 3,
                department_id: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                user_code: 'SV003',
                name: 'Lý Văn Minh',
                password: password,
                email: 'minh.lv@student.university.edu.vn',
                birthday: '2000-07-05',
                address: 'Hải Phòng',
                role_id: 3,
                department_id: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                user_code: 'SV004',
                name: 'Ngô Thị Lan',
                password: password,
                email: 'lan.nt@student.university.edu.vn',
                birthday: '2001-11-18',
                address: 'Hưng Yên',
                role_id: 3,
                department_id: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                user_code: 'SV005',
                name: 'Trương Văn Khôi',
                password: password,
                email: 'khoi.tv@student.university.edu.vn',
                birthday: '2000-09-27',
                address: 'Thái Bình',
                role_id: 3,
                department_id: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', null, {});
    }
};