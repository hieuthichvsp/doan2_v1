const teacherService = require('../../services/teacherService');

/**
 * Hiển thị trang lịch dạy
 */
const showSchedulePage = async (req, res) => {
    try {
        return res.render('TeacherView/scheduleTeacher', {
            title: 'Lịch dạy',
            active: 'schedule',
            user: req.user || req.session.user
        });
    } catch (error) {
        console.error('Error in showSchedulePage controller:', error);
        return res.status(500).send('Đã xảy ra lỗi khi tải trang lịch dạy');
    }
};

/**
 * Lấy lịch dạy theo khoảng thời gian (ngày/tuần/tháng)
 */
const getSchedulesByRange = async (req, res) => {
    try {
        const { teacherId, date, startDate, endDate, view, semesterId } = req.query;

        // Ghi log để debug
        console.log('Request params:', {
            teacherId, date, startDate, endDate, view, semesterId
        });

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin giáo viên'
            });
        }

        if (!semesterId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn học kỳ'
            });
        }

        let result;

        if (view === 'day' && date) {
            result = await teacherService.scheduleTeacherService.getSchedulesByDay(teacherId, date, semesterId);
        } else if ((view === 'week' || view === 'month') && startDate && endDate) {
            result = await teacherService.scheduleTeacherService.getSchedulesByRange(teacherId, startDate, endDate, semesterId);
        } else {
            // Mặc định lấy lịch trong ngày hiện tại
            const today = new Date().toISOString().split('T')[0];
            result = await teacherService.scheduleTeacherService.getSchedulesByDay(teacherId, today, semesterId);
        }

        // Ghi log kết quả để debug
        console.log('API Result:', {
            success: result.success,
            schedulesCount: result.schedules ? result.schedules.length : 0
        });

        return res.json(result);
    } catch (error) {
        console.error('Error in getSchedulesByRange controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu lịch dạy: ' + error.message
        });
    }
};

/**
 * Lấy danh sách môn học của giáo viên
 */
const getTeacherSubjects = async (req, res) => {
    try {
        const teacherId = req.query.teacherId || (req.user ? req.user.id : null);

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin giáo viên'
            });
        }

        const result = await teacherService.scheduleTeacherService.getTeacherSubjects(teacherId);

        return res.json(result);
    } catch (error) {
        console.error('Error in getTeacherSubjects controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách môn học'
        });
    }
};

/**
 * Lấy danh sách lớp học phần của giáo viên
 */
const getTeacherClassSessions = async (req, res) => {
    try {
        const teacherId = req.query.teacherId || (req.user ? req.user.id : null);

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin giáo viên'
            });
        }

        const result = await teacherService.scheduleTeacherService.getTeacherClassSessions(teacherId);

        return res.json(result);
    } catch (error) {
        console.error('Error in getTeacherClassSessions controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách lớp học phần'
        });
    }
};

/**
 * Lấy danh sách phòng học của giáo viên
 */
const getTeacherRooms = async (req, res) => {
    try {
        const teacherId = req.query.teacherId || (req.user ? req.user.id : null);

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin giáo viên'
            });
        }

        const result = await teacherService.scheduleTeacherService.getTeacherRooms(teacherId);

        return res.json(result);
    } catch (error) {
        console.error('Error in getTeacherRooms controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách phòng học'
        });
    }
};

/**
 * Lấy danh sách học kỳ
 */
const getSemesters = async (req, res) => {
    try {
        const result = await teacherService.scheduleTeacherService.getSemesters();
        return res.json(result);
    } catch (error) {
        console.error('Error in getSemesters controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách học kỳ: ' + error.message
        });
    }
};

module.exports = {
    showSchedulePage,
    getSchedulesByRange,
    getTeacherSubjects,
    getTeacherClassSessions,
    getTeacherRooms,
    getSemesters
};