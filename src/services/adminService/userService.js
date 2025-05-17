const model = require('../../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

/**
 * Lấy danh sách tất cả người dùng
 */
const getAllUsers = async () => {
    try {
        const users = await model.User.findAll({
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ],
            order: [['id', 'ASC']]
        });
        return users;
    } catch (error) {
        console.error('Service error - getAllUsers:', error);
        throw error;
    }
};

/**
 * Lấy danh sách người dùng có phân trang
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const getAllUsersWithPagination = async (limit, offset) => {
    try {
        const { count, rows: users } = await model.User.findAndCountAll({
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ],
            order: [['id', 'ASC']],
            limit,
            offset
        });
        return { users, count };
    } catch (error) {
        console.error('Service error - getAllUsersWithPagination:', error);
        throw error;
    }
};

/**
 * Tìm kiếm người dùng theo mã số
 * @param {string} code - Mã người dùng cần tìm
 */
const searchUsersByCode = async (code) => {
    try {
        return await model.User.findAll({
            where: {
                user_code: {
                    [Op.like]: `%${code}%`
                }
            },
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ],
            order: [['id', 'ASC']]
        });
    } catch (error) {
        console.error(`Service error - searchUsersByCode(${code}):`, error);
        throw error;
    }
};

/**
 * Tìm kiếm người dùng theo mã số có phân trang
 * @param {string} code - Mã người dùng cần tìm
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const searchUsersByCodeWithPagination = async (code, limit, offset) => {
    try {
        const { count, rows: users } = await model.User.findAndCountAll({
            where: {
                user_code: {
                    [Op.like]: `%${code}%`
                }
            },
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ],
            order: [['id', 'ASC']],
            limit,
            offset
        });
        return { users, count };
    } catch (error) {
        console.error(`Service error - searchUsersByCodeWithPagination(${code}):`, error);
        throw error;
    }
};

/**
 * Lấy thông tin người dùng theo ID
 * @param {number} userId - ID của người dùng
 */
const getUserById = async (userId) => {
    try {
        return await model.User.findByPk(userId, {
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ]
        });
    } catch (error) {
        console.error(`Service error - getUserById(${userId}):`, error);
        throw error;
    }
};

/**
 * Lấy thông tin người dùng theo Email
 * @param {string} email - Email của người dùng
 */
const getUserByEmail = async (email) => {
    try {
        return await model.User.findOne({
            where: { email },
            include: [
                { model: model.Role, as: 'role' }
            ]
        });
    } catch (error) {
        console.error(`Service error - getUserByEmail(${email}):`, error);
        throw error;
    }
};

/**
 * Lấy thông tin người dùng theo mã số
 * @param {string} userCode - Mã số của người dùng
 */
const getUserByCode = async (userCode) => {
    try {
        return await model.User.findOne({
            where: { user_code: userCode },
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ]
        });
    } catch (error) {
        console.error(`Service error - getUserByCode(${userCode}):`, error);
        throw error;
    }
};

/**
 * Tạo người dùng mới
 * @param {Object} userData - Dữ liệu người dùng mới
 */
const createUser = async (userData) => {
    try {
        // Kiểm tra email đã tồn tại chưa
        const existingEmail = await getUserByEmail(userData.email);
        if (existingEmail) {
            throw new Error('Email đã được sử dụng');
        }

        // Kiểm tra mã số đã tồn tại chưa
        const existingCode = await getUserByCode(userData.user_code);
        if (existingCode) {
            throw new Error('Mã số người dùng đã tồn tại');
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Tạo người dùng mới
        const newUser = await model.User.create({
            ...userData,
            password: hashedPassword,
            birthday: userData.birthday ? new Date(userData.birthday) : null
        });

        return await getUserById(newUser.id);
    } catch (error) {
        console.error('Service error - createUser:', error);
        throw error;
    }
};

/**
 * Cập nhật thông tin người dùng
 * @param {number} userId - ID của người dùng cần cập nhật
 * @param {Object} userData - Dữ liệu cập nhật
 */
const updateUser = async (userId, userData) => {
    try {
        const user = await model.User.findByPk(userId);

        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        // Kiểm tra nếu có thay đổi email
        if (userData.email && userData.email !== user.email) {
            const existingEmail = await getUserByEmail(userData.email);
            if (existingEmail && existingEmail.id !== userId) {
                throw new Error('Email đã được sử dụng bởi người dùng khác');
            }
        }

        // Kiểm tra nếu có thay đổi mã số
        if (userData.user_code && userData.user_code !== user.user_code) {
            const existingCode = await getUserByCode(userData.user_code);
            if (existingCode && existingCode.id !== userId) {
                throw new Error('Mã số người dùng đã tồn tại');
            }
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = { ...userData };

        // Xử lý ngày sinh
        if (updateData.birthday) {
            updateData.birthday = new Date(updateData.birthday);
        }

        // Xử lý mật khẩu nếu có thay đổi
        if (updateData.password && updateData.password.trim() !== '') {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password;
        }

        // Cập nhật dữ liệu
        await user.update(updateData);

        return await getUserById(userId);
    } catch (error) {
        console.error(`Service error - updateUser(${userId}):`, error);
        throw error;
    }
};

/**
 * Xóa người dùng
 * @param {number} userId - ID của người dùng cần xóa
 */
const deleteUser = async (userId) => {
    try {
        const user = await model.User.findByPk(userId);

        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        // Kiểm tra các quan hệ trước khi xóa
        const enrollments = await model.Enrollment.count({
            where: { id_student: userId }
        });

        if (enrollments > 0) {
            throw new Error('Không thể xóa người dùng này vì họ đã đăng ký lớp học');
        }

        const teachingSessions = await model.ClassSession.count({
            where: { teacher_id: userId }
        });

        if (teachingSessions > 0) {
            throw new Error('Không thể xóa người dùng này vì họ là giáo viên của một hoặc nhiều lớp học');
        }

        // Xóa các bản ghi liên quan
        await model.RfidUser.destroy({
            where: { student_id: userId }
        });

        await model.Attendance.destroy({
            where: { student_id: userId }
        });

        // Xóa người dùng
        await user.destroy();

        return true;
    } catch (error) {
        console.error(`Service error - deleteUser(${userId}):`, error);
        throw error;
    }
};

/**
 * Xác thực người dùng khi đăng nhập
 * @param {string} email - Email đăng nhập
 * @param {string} password - Mật khẩu đăng nhập
 */
const authenticateUser = async (email, password) => {
    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return { success: false, message: 'Email không tồn tại' };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return { success: false, message: 'Mật khẩu không chính xác' };
        }

        return {
            success: true,
            user: {
                id: user.id,
                user_code: user.user_code,
                name: user.name,
                email: user.email,
                role: user.role ? user.role.name : null,
                role_id: user.role_id
            }
        };
    } catch (error) {
        console.error(`Service error - authenticateUser(${email}):`, error);
        throw error;
    }
};

/**
 * Đổi mật khẩu của người dùng
 * @param {number} userId - ID của người dùng
 * @param {string} currentPassword - Mật khẩu hiện tại
 * @param {string} newPassword - Mật khẩu mới
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        const user = await model.User.findByPk(userId);

        if (!user) {
            return { success: false, message: 'Không tìm thấy người dùng' };
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return { success: false, message: 'Mật khẩu hiện tại không chính xác' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return { success: true, message: 'Đổi mật khẩu thành công' };
    } catch (error) {
        console.error(`Service error - changePassword(${userId}):`, error);
        throw error;
    }
};

/**
 * Khôi phục mật khẩu cho người dùng
 * @param {string} email - Email của người dùng
 */
const resetPassword = async (email) => {
    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return { success: false, message: 'Email không tồn tại trong hệ thống' };
        }

        // Tạo mật khẩu ngẫu nhiên
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await user.update({ password: hashedPassword });

        // Trong thực tế, bạn sẽ gửi email với mật khẩu tạm thời này
        // Nhưng ở đây chúng ta chỉ trả về để demo
        return {
            success: true,
            message: 'Khôi phục mật khẩu thành công',
            tempPassword
        };
    } catch (error) {
        console.error(`Service error - resetPassword(${email}):`, error);
        throw error;
    }
};

/**
 * Lấy danh sách người dùng theo vai trò
 * @param {number} roleId - ID của vai trò
 */
const getUsersByRole = async (roleId) => {
    try {
        return await model.User.findAll({
            where: { role_id: roleId },
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ],
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error(`Service error - getUsersByRole(${roleId}):`, error);
        throw error;
    }
};

/**
 * Lấy danh sách người dùng theo phòng ban
 * @param {number} departmentId - ID của phòng ban
 */
const getUsersByDepartment = async (departmentId) => {
    try {
        return await model.User.findAll({
            where: { department_id: departmentId },
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ],
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error(`Service error - getUsersByDepartment(${departmentId}):`, error);
        throw error;
    }
};
const getTeachers = async () => {
    try {
        return await model.User.findAll({
            where: { role_id: 2 }, // Assuming role_id 2 is for teachers
            include: [
                { model: model.Role, as: 'role' },
                { model: model.Department, as: 'department' }
            ],
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error('Service error - getTeachers:', error);
        throw error;
    }
}
    ;

/**
 * Lấy danh sách người dùng chưa được gán RFID
 */
const getAvailableUsersForRfid = async () => {
    try {
        const users = await model.User.findAll({
            include: [
                {
                    model: model.RfidUser,
                    as: 'rfidCards',
                    required: false
                }
            ],
            where: {
                role_id: 3
            },
            order: [['name', 'ASC']]
        });

        // Đúng alias: user.rfidCards thay vì user.rfidUsers
        const availableUsers = users.filter(user => {
            return !user.rfidCards || !user.rfidCards.some(ru => ru.status === true);
        });

        return {
            success: true,
            data: availableUsers
        };
    } catch (error) {
        console.error('Error in getAvailableUsersForRfid service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách người dùng khả dụng'
        };
    }
};

// Lấy tất cả sinh viên
const getStudents = async () => {
    try {
        return await model.User.findAll({
            where: { role_id: 3 }, // Giả sử role_id 3 là sinh viên
            attributes: ['id', 'name', 'user_code', 'email'],
            order: [['user_code', 'ASC']]
        });
    } catch (error) {
        console.error('Error in getStudents service:', error);
        throw error;
    }
};

// Lấy sinh viên có thể đăng ký vào lớp học phần cụ thể (chưa đăng ký)
const getAvailableStudentsForClassSession = async (classSessionId) => {
    try {
        // Lấy danh sách ID sinh viên đã đăng ký lớp học phần này
        const enrolledStudentIds = await model.Enrollment.findAll({
            where: { id_classsession: classSessionId },
            attributes: ['id_student']
        }).then(enrollments => enrollments.map(e => e.id_student));
        
        // Lấy sinh viên chưa đăng ký
        const availableStudents = await model.User.findAll({
            where: {
                role_id: 3, // Sinh viên
                id: {
                    [Op.notIn]: enrolledStudentIds.length > 0 ? enrolledStudentIds : [0]
                }
            },
            attributes: ['id', 'name', 'user_code', 'email'],
            order: [['user_code', 'ASC']]
        });
        
        return availableStudents;
    } catch (error) {
        console.error('Error in getAvailableStudentsForClassSession service:', error);
        throw error;
    }
};

module.exports = {
    getAllUsers,
    getAllUsersWithPagination,
    searchUsersByCode,
    searchUsersByCodeWithPagination,
    getUserById,
    getUserByEmail,
    getUserByCode,
    createUser,
    updateUser,
    deleteUser,
    authenticateUser,
    changePassword,
    resetPassword,
    getUsersByRole,
    getUsersByDepartment,
    getTeachers,
    getAvailableUsersForRfid,
    getStudents,
    getAvailableStudentsForClassSession
};