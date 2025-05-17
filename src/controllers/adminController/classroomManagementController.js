const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý lớp học
 */
const showClassroomManagement = async (req, res) => {
    try {
        let classrooms = [];
        let searchCode = req.query.searchCode || '';
        let searchResults = false;

        // Phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 7; // Số lượng lớp học trên mỗi trang
        const offset = (page - 1) * limit;
        let totalClassrooms = 0;
        let totalPages = 0;

        if (searchCode) {
            // Tìm kiếm với phân trang
            const result = await adminService.classroomService.searchClassroomsByCodeWithPagination(searchCode, limit, offset);
            classrooms = result.classrooms;
            totalClassrooms = result.count;
            searchResults = true;
        } else {
            // Lấy tất cả với phân trang
            const result = await adminService.classroomService.getAllClassroomsWithPagination(limit, offset);
            classrooms = result.classrooms;
            totalClassrooms = result.count;
        }

        totalPages = Math.ceil(totalClassrooms / limit);

        res.render('adminView/classroomManagement', {
            title: 'Quản lý lớp học',
            classrooms,
            user: req.session.user,
            searchCode,
            searchResults,
            pagination: {
                page,
                limit,
                totalClassrooms,
                totalPages
            }
        });
    } catch (error) {
        console.error('Controller error - showClassroomManagement:', error);
        res.status(500).render('error/500', {
            title: 'Lỗi Server',
            message: 'Không thể tải trang quản lý lớp học',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * API lấy tất cả lớp học
 */
const getAllClassrooms = async (req, res) => {
    try {
        const classrooms = await adminService.classroomService.getAllClassrooms();
        res.json({ success: true, classrooms });
    } catch (error) {
        console.error('Controller error - getAllClassrooms:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách lớp học' });
    }
};

/**
 * API lấy thông tin lớp học theo ID
 */
const getClassroomById = async (req, res) => {
    try {
        const id = req.params.id;
        const classroom = await adminService.classroomService.getClassroomById(id);
        res.json({ success: true, classroom });
    } catch (error) {
        console.error('Controller error - getClassroomById:', error);
        res.status(500).json({ success: false, message: 'Không thể tải thông tin lớp học' });
    }
};

/**
 * API tạo lớp học mới
 */
const createClassroom = async (req, res) => {
    try {
        const result = await adminService.classroomService.createClassroom(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json(result);
    } catch (error) {
        console.error('Controller error - createClassroom:', error);
        res.status(500).json({ success: false, message: 'Không thể tạo lớp học mới' });
    }
};

/**
 * API cập nhật thông tin lớp học
 */
const updateClassroom = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await adminService.classroomService.updateClassroom(id, req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error('Controller error - updateClassroom:', error);
        res.status(500).json({ success: false, message: 'Không thể cập nhật lớp học' });
    }
};

/**
 * API xóa lớp học
 */
const deleteClassroom = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await adminService.classroomService.deleteClassroom(id);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error('Controller error - deleteClassroom:', error);
        res.status(500).json({ success: false, message: 'Không thể xóa lớp học' });
    }
};

/**
 * API kiểm tra mã lớp học trùng lặp
 */
const checkDuplicateRoomCode = async (req, res) => {
    try {
        const { code, excludeId } = req.query;
        const result = await adminService.classroomService.checkDuplicateRoomCode(code, excludeId);
        res.json(result);
    } catch (error) {
        console.error('Controller error - checkDuplicateRoomCode:', error);
        res.status(500).json({ success: false, message: 'Không thể kiểm tra mã lớp học' });
    }
};

module.exports = {
    showClassroomManagement,
    getAllClassrooms,
    getClassroomById,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    checkDuplicateRoomCode
};