const adminService = require('../../services/adminService');

/**
 * Lấy dữ liệu thống kê tổng quan
 */
const getStats = async (req, res) => {
    try {
        const stats = await adminService.dashboardService.getStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải dữ liệu thống kê'
        });
    }
};

/**
 * Lấy dữ liệu điểm danh theo khoảng thời gian
 */
const getAttendanceData = async (req, res) => {
    try {
        const period = req.query.period || 'week';
        const attendanceData = await adminService.dashboardService.getAttendanceData(period);
        res.json({
            success: true,
            attendance: attendanceData
        });
    } catch (error) {
        console.error('Error getting attendance data:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải dữ liệu điểm danh'
        });
    }
};

/**
 * Lấy dữ liệu phân bố học phần theo loại
 */
const getClassTypeData = async (req, res) => {
    try {
        const classTypeData = await adminService.dashboardService.getClassTypeDistribution();
        res.json({
            success: true,
            ...classTypeData
        });
    } catch (error) {
        console.error('Error getting class type distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải dữ liệu phân bố học phần'
        });
    }
};

/**
 * Lấy danh sách học phần đang diễn ra
 */
const getCurrentSessions = async (req, res) => {
    try {
        const sessions = await adminService.dashboardService.getCurrentSessions();
        res.json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Error getting current sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách học phần đang diễn ra'
        });
    }
};

/**
 * Lấy trạng thái các thiết bị
 */
const getDeviceStatus = async (req, res) => {
    try {
        const devices = await adminService.dashboardService.getDeviceStatus();
        res.json({
            success: true,
            devices
        });
    } catch (error) {
        console.error('Error getting device status:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải trạng thái thiết bị'
        });
    }
};

/**
 * Lấy danh sách hoạt động gần đây
 */
const getRecentActivities = async (req, res) => {
    try {
        const activities = await adminService.dashboardService.getRecentActivities();
        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Error getting recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách hoạt động gần đây'
        });
    }
};

module.exports = {
    getStats,
    getAttendanceData,
    getClassTypeData,
    getCurrentSessions,
    getDeviceStatus,
    getRecentActivities
};