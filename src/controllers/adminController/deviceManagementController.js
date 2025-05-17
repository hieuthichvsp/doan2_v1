const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý thiết bị
 */
const showDeviceManagement = async (req, res) => {
    try {
        return res.render('adminView/deviceManagement');
    } catch (error) {
        console.error('Error in showDeviceManagement controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * Lấy tất cả thiết bị có phân trang
 */
const getAllDevices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await adminService.deviceService.getAllDevicesWithPagination(search, page, limit);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in getAllDevices controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * Lấy thông tin thiết bị theo ID
 */
const getDeviceById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.deviceService.getDeviceById(id);
        return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        console.error('Error in getDeviceById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * Kiểm tra mã thiết bị trùng lặp
 */
const checkDuplicateDeviceCode = async (req, res) => {
    try {
        const { deviceCode, id } = req.query;
        const result = await adminService.deviceService.checkDuplicateDeviceCode(deviceCode, id);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in checkDuplicateDeviceCode controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * Tạo thiết bị mới
 */
const createDevice = async (req, res) => {
    try {
        const result = await adminService.deviceService.createDevice(req.body);
        return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        console.error('Error in createDevice controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * Cập nhật thiết bị
 */
const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.deviceService.updateDevice(id, req.body);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in updateDevice controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * Xóa thiết bị
 */
const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.deviceService.deleteDevice(id);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in deleteDevice controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * Lấy tất cả lớp học có thể gán thiết bị
 */
const getAvailableClasses = async (req, res) => {
    try {
        const result = await adminService.deviceService.getAvailableClasses();
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in getAvailableClasses controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    showDeviceManagement,
    getAllDevices,
    getDeviceById,
    checkDuplicateDeviceCode,
    createDevice,
    updateDevice,
    deleteDevice,
    getAvailableClasses
};