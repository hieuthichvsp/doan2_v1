const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý khoa
 */
const showDepartmentManagement = async (req, res) => {
    try {
        let departments = [];
        let searchTerm = req.query.search || '';
        let searchResults = false;

        // Phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Số lượng khoa trên mỗi trang
        const offset = (page - 1) * limit;

        if (searchTerm) {
            // Tìm kiếm khoa theo tên hoặc mã
            departments = await adminService.departmentService.searchDepartments(searchTerm);
            searchResults = true;
        } else {
            // Lấy tất cả khoa và thêm số lượng người dùng
            departments = await adminService.departmentService.getDepartmentsWithUserCount();
        }

        // Tính toán phân trang
        const totalDepartments = departments.length;
        const totalPages = Math.ceil(totalDepartments / limit);

        // Trích xuất các khoa cho trang hiện tại
        const paginatedDepartments = departments.slice(offset, offset + limit);

        res.render('adminView/departmentManagement', {
            title: 'Quản lý Khoa',
            departments: paginatedDepartments,
            user: req.session.user,
            searchTerm,
            searchResults,
            pagination: {
                page,
                limit,
                totalDepartments,
                totalPages
            }
        });
    } catch (error) {
        console.error('Controller error - showDepartmentManagement:', error);
        res.status(500).render('error/500', {
            title: 'Lỗi Server',
            message: 'Không thể tải trang quản lý khoa',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * API lấy tất cả khoa
 */
const getAllDepartments = async (req, res) => {
    try {
        const departments = await adminService.departmentService.getAllDepartments();
        res.json({ success: true, departments });
    } catch (error) {
        console.error('Controller error - getAllDepartments:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách khoa' });
    }
};

/**
 * API lấy thông tin khoa theo ID
 */
const getDepartmentById = async (req, res) => {
    try {
        const id = req.params.id;
        const department = await adminService.departmentService.getDepartmentById(id);

        if (!department) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khoa' });
        }

        res.json({ success: true, department });
    } catch (error) {
        console.error('Controller error - getDepartmentById:', error);
        res.status(500).json({ success: false, message: 'Không thể tải thông tin khoa' });
    }
};

/**
 * API lấy danh sách người dùng theo khoa
 */
const getUsersByDepartment = async (req, res) => {
    try {
        const departmentId = req.params.id;
        const users = await adminService.departmentService.getUsersByDepartment(departmentId);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Controller error - getUsersByDepartment:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách người dùng' });
    }
};

/**
 * API tạo khoa mới
 */
const createDepartment = async (req, res) => {
    try {
        const departmentData = {
            departcode: req.body.departcode,
            name: req.body.name
        };

        const newDepartment = await adminService.departmentService.createDepartment(departmentData);
        res.status(201).json({ success: true, department: newDepartment });
    } catch (error) {
        console.error('Controller error - createDepartment:', error);
        let errorMessage = 'Không thể tạo khoa mới';

        if (error.message.includes('tồn tại')) {
            errorMessage = error.message;
        }

        res.status(400).json({ success: false, message: errorMessage });
    }
};

/**
 * API cập nhật thông tin khoa
 */
const updateDepartment = async (req, res) => {
    try {
        const id = req.params.id;
        const departmentData = {
            departcode: req.body.departcode,
            name: req.body.name
        };

        const updatedDepartment = await adminService.departmentService.updateDepartment(id, departmentData);
        res.json({ success: true, department: updatedDepartment });
    } catch (error) {
        console.error('Controller error - updateDepartment:', error);
        let errorMessage = 'Không thể cập nhật khoa';

        if (error.message.includes('tồn tại') || error.message.includes('không tìm thấy')) {
            errorMessage = error.message;
        }

        res.status(400).json({ success: false, message: errorMessage });
    }
};

/**
 * API xóa khoa
 */
const deleteDepartment = async (req, res) => {
    try {
        const id = req.params.id;
        await adminService.departmentService.deleteDepartment(id);
        res.json({ success: true, message: 'Xóa khoa thành công' });
    } catch (error) {
        console.error('Controller error - deleteDepartment:', error);

        // Kiểm tra lỗi liên quan đến khoa đang được sử dụng
        if (error.message.includes('không thể xóa') || error.message.includes('đang thuộc')) {
            return res.status(400).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: 'Không thể xóa khoa' });
    }
};

/**
 * API kiểm tra mã khoa trùng lặp
 */
const checkDuplicateDepartmentCode = async (req, res) => {
    try {
        const code = req.query.value;
        const excludeId = req.query.excludeId ? parseInt(req.query.excludeId) : null;

        // Tìm khoa có mã trùng
        const existingDepartment = await adminService.departmentService.getDepartmentByCode(code);

        // Nếu không tìm thấy hoặc đang kiểm tra chính nó (khi sửa)
        if (!existingDepartment || (excludeId && existingDepartment.id === excludeId)) {
            return res.json({ exists: false });
        }

        res.json({ exists: true, department: existingDepartment });
    } catch (error) {
        console.error('Controller error - checkDuplicateDepartmentCode:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra mã khoa' });
    }
};

/**
 * API kiểm tra tên khoa trùng lặp
 */
const checkDuplicateDepartmentName = async (req, res) => {
    try {
        const name = req.query.value;
        const excludeId = req.query.excludeId ? parseInt(req.query.excludeId) : null;

        // Tìm khoa có tên trùng
        const existingDepartment = await adminService.departmentService.getDepartmentByName(name);

        // Nếu không tìm thấy hoặc đang kiểm tra chính nó (khi sửa)
        if (!existingDepartment || (excludeId && existingDepartment.id === excludeId)) {
            return res.json({ exists: false });
        }

        res.json({ exists: true, department: existingDepartment });
    } catch (error) {
        console.error('Controller error - checkDuplicateDepartmentName:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra tên khoa' });
    }
};

module.exports = {
    showDepartmentManagement,
    getAllDepartments,
    getDepartmentById,
    getUsersByDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    checkDuplicateDepartmentCode,
    checkDuplicateDepartmentName
};