const teacherService = require('../../services/teacherService');

/**
 * Hiển thị trang dashboard cho giáo viên
 */
const showDashboard = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User not found in request');
            return res.redirect('/login');
        }
        
        res.render('TeacherView/dashboardTeacher', {
            title: 'Dashboard Giáo viên',
            user: req.user
        });
    } catch (error) {
        console.error('Error in showDashboard controller:', error);
        res.status(500).render('error', {
            message: 'Đã xảy ra lỗi khi tải trang Dashboard',
            error
        });
    }
};

/**
 * Lấy dữ liệu thống kê nhanh
 */
const getQuickStats = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }
        
        const teacherId = req.user.id;
        const stats = await teacherService.dashboardService.getQuickStats(teacherId);
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting quick stats:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải dữ liệu thống kê'
        });
    }
};

/**
 * Lấy lịch dạy hôm nay
 */
const getTodaySchedules = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }
        
        const teacherId = req.user.id;
        const schedules = await teacherService.dashboardService.getTodaySchedules(teacherId);
        res.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Error getting today schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải lịch dạy hôm nay'
        });
    }
};

/**
 * Lấy các thông báo nhắc nhở
 */
const getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }
        
        const teacherId = req.user.id;
        const notifications = await teacherService.dashboardService.getPendingAttendances(teacherId);
        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải thông báo nhắc nhở'
        });
    }
};

/**
 * Lấy danh sách lớp học phần đang giảng dạy
 */
const getTeachingClasses = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }
        
        const teacherId = req.user.id;
        const classes = await teacherService.dashboardService.getTeachingClasses(teacherId);
        res.json({
            success: true,
            classes
        });
    } catch (error) {
        console.error('Error getting teaching classes:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách lớp học phần'
        });
    }
};

/**
 * Lấy danh sách sinh viên có vấn đề về chuyên cần
 */
const getAttendanceIssues = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }
        
        const teacherId = req.user.id;
        const issues = await teacherService.dashboardService.getStudentsWithAttendanceIssues(teacherId);
        res.json({
            success: true,
            issues
        });
    } catch (error) {
        console.error('Error getting attendance issues:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách vấn đề chuyên cần'
        });
    }
};

/**
 * Lấy lịch dạy sắp tới
 */
const getUpcomingSchedules = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }
        
        const teacherId = req.user.id;
        const schedules = await teacherService.dashboardService.getUpcomingSchedules(teacherId);
        res.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Error getting upcoming schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải lịch dạy sắp tới'
        });
    }
};

module.exports = {
    showDashboard,
    getQuickStats,
    getTodaySchedules,
    getNotifications,
    getTeachingClasses,
    getAttendanceIssues,
    getUpcomingSchedules
};