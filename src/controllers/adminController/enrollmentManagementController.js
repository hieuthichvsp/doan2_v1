const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý đăng ký môn học
 */
const showEnrollmentManagement = async (req, res) => {
    try {
        let enrollments = [];
        let searchCode = req.query.searchCode || '';
        let classSessionFilter = req.query.classSession || '';
        let searchResults = false;

        // Thêm logic phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 7; // Số lượng đăng ký trên mỗi trang
        const offset = (page - 1) * limit;
        let totalEnrollments = 0;
        let totalPages = 0;

        // Lấy danh sách các lớp học phần để hiển thị trong bộ lọc
        const classSessions = await adminService.classsessionService.getClassSessionsWithSubjects();

        if (searchCode || classSessionFilter) {
            // Tìm kiếm với phân trang
            const result = await adminService.enrollmentService.searchEnrollmentsWithPagination(
                searchCode,
                classSessionFilter,
                limit,
                offset
            );
            enrollments = result.enrollments;
            totalEnrollments = result.count;
            searchResults = true;
        } else {
            // Lấy tất cả với phân trang
            const result = await adminService.enrollmentService.getAllEnrollmentsWithPagination(limit, offset);
            enrollments = result.enrollments;
            totalEnrollments = result.count;
        }

        totalPages = Math.ceil(totalEnrollments / limit);

        res.render('adminView/enrollmentManagement', {
            title: 'Quản lý đăng ký môn học',
            enrollments,
            classSessions,
            user: req.session.user,
            searchCode,
            classSessionFilter,
            searchResults,
            pagination: {
                page,
                limit,
                totalEnrollments,
                totalPages
            }
        });
    } catch (error) {
        console.error('Controller error - showEnrollmentManagement:', error);
        res.status(500).render('error/500', {
            title: 'Lỗi Server',
            message: 'Không thể tải trang quản lý đăng ký môn học',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * API lấy tất cả đăng ký môn học
 */
const getAllEnrollments = async (req, res) => {
    try {
        const enrollments = await adminService.enrollmentService.getAllEnrollments();
        res.json({ success: true, enrollments });
    } catch (error) {
        console.error('Controller error - getAllEnrollments:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách đăng ký môn học' });
    }
};

/**
 * API lấy chi tiết đăng ký môn học
 */
const getEnrollmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const enrollment = await adminService.enrollmentService.getEnrollmentById(id);

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký môn học' });
        }

        res.json({ success: true, enrollment });
    } catch (error) {
        console.error(`Controller error - getEnrollmentById(${req.params.id}):`, error);
        res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin đăng ký môn học' });
    }
};

/**
 * API tạo đăng ký môn học mới
 */
const createEnrollment = async (req, res) => {
    try {
        const enrollmentData = req.body;
        const newEnrollment = await adminService.enrollmentService.createEnrollment(enrollmentData);

        res.status(201).json({
            success: true,
            enrollment: newEnrollment,
            message: 'Đăng ký môn học thành công'
        });
    } catch (error) {
        console.error('Controller error - createEnrollment:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi tạo đăng ký môn học mới'
        });
    }
};

/**
 * API xóa đăng ký môn học
 */
const deleteEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        await adminService.enrollmentService.deleteEnrollment(id);
        res.json({ success: true, message: 'Hủy đăng ký môn học thành công' });
    } catch (error) {
        console.error(`Controller error - deleteEnrollment(${req.params.id}):`, error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi hủy đăng ký môn học'
        });
    }
};

/**
 * API lấy danh sách sinh viên có thể đăng ký vào một học phần cụ thể
 */
const getAvailableStudentsForClassSession = async (req, res) => {
    try {
        const { classSessionId } = req.params;
        const students = await adminService.userService.getAvailableStudentsForClassSession(classSessionId);
        res.json({ success: true, students });
    } catch (error) {
        console.error('Controller error - getAvailableStudentsForClassSession:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách sinh viên khả dụng' });
    }
};

/**
 * API lấy thông tin sức chứa của một học phần
 */
const getClassSessionCapacity = async (req, res) => {
    try {
        const { classSessionId } = req.params;
        const capacityInfo = await adminService.classsessionService.checkClassSessionCapacity(classSessionId);
        res.json({ success: true, capacityInfo });
    } catch (error) {
        console.error('Controller error - getClassSessionCapacity:', error);
        res.status(500).json({ success: false, message: 'Không thể tải thông tin sức chứa học phần' });
    }
};

/**
 * API đăng ký hàng loạt sinh viên vào một học phần
 */
const bulkEnroll = async (req, res) => {
    try {
        const { classSessionId, studentIds } = req.body;
        
        if (!classSessionId || !studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại học phần và danh sách sinh viên.'
            });
        }

        const result = await adminService.enrollmentService.bulkEnroll(classSessionId, studentIds);
        res.json(result);
    } catch (error) {
        console.error('Controller error - bulkEnroll:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đăng ký hàng loạt'
        });
    }
};

module.exports = {
    showEnrollmentManagement,
    getAllEnrollments,
    getEnrollmentById,
    createEnrollment,
    deleteEnrollment,
    getAvailableStudentsForClassSession,
    getClassSessionCapacity,
    bulkEnroll
};