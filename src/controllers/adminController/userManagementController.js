const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý người dùng
 */
const showUserManagement = async (req, res) => {
    try {
        let users = [];
        let searchCode = req.query.searchCode || '';
        let searchResults = false;

        // Thêm logic phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 7; // Số lượng người dùng trên mỗi trang
        const offset = (page - 1) * limit;
        let totalUsers = 0;
        let totalPages = 0;

        if (searchCode) {
            // Tìm kiếm với phân trang
            const result = await adminService.userService.searchUsersByCodeWithPagination(searchCode, limit, offset);
            users = result.users;
            totalUsers = result.count;
            searchResults = true;
        } else {
            // Lấy tất cả với phân trang
            const result = await adminService.userService.getAllUsersWithPagination(limit, offset);
            users = result.users;
            totalUsers = result.count;
        }

        totalPages = Math.ceil(totalUsers / limit);

        res.render('adminView/userManagement', {
            title: 'Quản lý người dùng',
            users,
            user: req.session.user,
            searchCode,
            searchResults,
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages
            }
        });
    } catch (error) {
        console.error('Controller error - showUserManagement:', error);
        res.status(500).render('error/500', {
            title: 'Lỗi Server',
            message: 'Không thể tải trang quản lý người dùng',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * API lấy tất cả người dùng
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await adminService.userService.getAllUsers();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Controller error - getAllUsers:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách người dùng' });
    }
};

/**
 * API lấy tất cả vai trò
 */
const getAllRoles = async (req, res) => {
    try {
        const roles = await adminService.roleService.getAllRoles();
        res.json({ success: true, roles });
    } catch (error) {
        console.error('Controller error - getAllRoles:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách vai trò' });
    }
};

/**
 * API lấy tất cả phòng ban
 */
const getAllDepartments = async (req, res) => {
    try {
        const departments = await adminService.departmentService.getAllDepartments();
        res.json({ success: true, departments });
    } catch (error) {
        console.error('Controller error - getAllDepartments:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách phòng ban' });
    }
};

/**
 * API lấy thông tin người dùng theo ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await adminService.userService.getUserById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error(`Controller error - getUserById(${req.params.id}):`, error);
        res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin người dùng' });
    }
};

/**
 * API tạo người dùng mới
 */
const createUser = async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await adminService.userService.createUser(userData);

        res.status(201).json({
            success: true,
            user: newUser,
            message: 'Tạo người dùng thành công'
        });
    } catch (error) {
        console.error('Controller error - createUser:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi tạo người dùng mới'
        });
    }
};

/**
 * API cập nhật thông tin người dùng
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userData = req.body;

        const updatedUser = await adminService.userService.updateUser(id, userData);

        res.json({
            success: true,
            user: updatedUser,
            message: 'Cập nhật thông tin người dùng thành công'
        });
    } catch (error) {
        console.error(`Controller error - updateUser(${req.params.id}):`, error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật thông tin người dùng'
        });
    }
};

/**
 * API xóa người dùng
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra người dùng đang đăng nhập không thể tự xóa chính mình
        if (req.session.user && req.session.user.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản đang đăng nhập'
            });
        }

        await adminService.userService.deleteUser(id);
        res.json({ success: true, message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error(`Controller error - deleteUser(${req.params.id}):`, error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa người dùng'
        });
    }
};

/**
 * API lấy danh sách người dùng theo vai trò
 */
const getUsersByRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        const users = await adminService.userService.getUsersByRole(roleId);

        res.json({ success: true, users });
    } catch (error) {
        console.error(`Controller error - getUsersByRole(${req.params.roleId}):`, error);
        res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách người dùng theo vai trò' });
    }
};

/**
 * API lấy danh sách người dùng theo phòng ban
 */
const getUsersByDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;
        const users = await adminService.userService.getUsersByDepartment(departmentId);

        res.json({ success: true, users });
    } catch (error) {
        console.error(`Controller error - getUsersByDepartment(${req.params.departmentId}):`, error);
        res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách người dùng theo phòng ban' });
    }
};

module.exports = {
    showUserManagement,
    getAllUsers,
    getAllRoles,
    getAllDepartments,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUsersByRole,
    getUsersByDepartment
};