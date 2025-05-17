const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý môn học
 */
const showSubjectManagement = async (req, res) => {
    try {
        let subjects = [];
        let searchCode = req.query.searchCode || '';
        let searchResults = false;

        // Thêm phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 7; // Số lượng môn học trên mỗi trang
        const offset = (page - 1) * limit;
        let totalSubjects = 0;
        let totalPages = 0;

        if (searchCode) {
            // Tìm kiếm với phân trang
            const result = await adminService.subjectService.searchSubjectsByCodeWithPagination(searchCode, limit, offset);
            subjects = result.subjects;
            totalSubjects = result.count;
            searchResults = true;
        } else {
            // Lấy tất cả với phân trang
            const result = await adminService.subjectService.getAllSubjectsWithPagination(limit, offset);
            subjects = result.subjects;
            totalSubjects = result.count;
        }

        totalPages = Math.ceil(totalSubjects / limit);

        res.render('adminView/subjectManagement', {
            title: 'Quản lý môn học',
            subjects,
            user: req.session.user,
            searchCode,
            searchResults,
            pagination: {
                page,
                limit,
                totalSubjects,
                totalPages
            }
        });
    } catch (error) {
        console.error('Controller error - showSubjectManagement:', error);
        res.status(500).render('error/500', {
            title: 'Lỗi Server',
            message: 'Không thể tải trang quản lý môn học',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * API lấy tất cả môn học
 */
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await adminService.subjectService.getAllSubjects();
        res.json({ success: true, subjects });
    } catch (error) {
        console.error('Controller error - getAllSubjects:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách môn học' });
    }
};

/**
 * API lấy thông tin môn học theo ID
 */
const getSubjectById = async (req, res) => {
    try {
        const id = req.params.id;
        const subject = await adminService.subjectService.getSubjectById(id);
        res.json({ success: true, subject });
    } catch (error) {
        console.error('Controller error - getSubjectById:', error);
        res.status(500).json({ success: false, message: 'Không thể tải thông tin môn học' });
    }
};

/**
 * API tạo môn học mới
 */
const createSubject = async (req, res) => {
    try {
        const result = await adminService.subjectService.createSubject(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json(result);
    } catch (error) {
        console.error('Controller error - createSubject:', error);
        res.status(500).json({ success: false, message: 'Không thể tạo môn học mới' });
    }
};

/**
 * API cập nhật thông tin môn học
 */
const updateSubject = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await adminService.subjectService.updateSubject(id, req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error('Controller error - updateSubject:', error);
        res.status(500).json({ success: false, message: 'Không thể cập nhật môn học' });
    }
};

/**
 * API xóa môn học
 */
const deleteSubject = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await adminService.subjectService.deleteSubject(id);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error('Controller error - deleteSubject:', error);
        res.status(500).json({ success: false, message: 'Không thể xóa môn học' });
    }
};

/**
 * API kiểm tra mã môn học trùng lặp
 */
const checkDuplicateSubject = async (req, res) => {
    try {
        const code = req.query.value;
        const excludeId = req.query.excludeId ? parseInt(req.query.excludeId) : null;

        if (!code) {
            return res.status(400).json({
                exists: false,
                message: 'Thiếu mã môn học cần kiểm tra'
            });
        }

        const result = await adminService.subjectService.checkDuplicateSubjectCode(code, excludeId);
        res.json(result);
    } catch (error) {
        console.error('Controller error - checkDuplicateSubject:', error);
        res.status(500).json({
            exists: false,
            message: 'Lỗi khi kiểm tra trùng lặp mã môn học'
        });
    }
};

module.exports = {
    showSubjectManagement,
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    checkDuplicateSubject
};