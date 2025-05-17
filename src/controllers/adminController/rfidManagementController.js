const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý RFID
 */
const showRfidManagement = async (req, res) => {
    try {
        return res.render('adminView/rfidManagement');
    } catch (error) {
        console.error('Error in showRfidManagement controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API lấy tất cả RFID có phân trang
 */
const getAllRfids = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await adminService.rfidService.getAllRfidsWithPagination(search, page, limit);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in getAllRfids controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API lấy thông tin RFID theo ID
 */
const getRfidById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.rfidService.getRfidById(id);
        return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        console.error('Error in getRfidById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API kiểm tra mã RFID trùng lặp
 */
const checkDuplicateRfid = async (req, res) => {
    try {
        const { code, id } = req.query;
        const result = await adminService.rfidService.checkDuplicateRfid(code, id);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in checkDuplicateRfid controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API tạo mới RFID
 */
const createRfid = async (req, res) => {
    try {
        const { code } = req.body;
        const result = await adminService.rfidService.createRfid({ code });
        return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        console.error('Error in createRfid controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API cập nhật RFID
 */
const updateRfid = async (req, res) => {
    try {
        const { id } = req.params;
        const { code } = req.body;
        const result = await adminService.rfidService.updateRfid(id, { code });
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in updateRfid controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API xóa RFID
 */
const deleteRfid = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.rfidService.deleteRfid(id);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in deleteRfid controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API lấy tất cả RFID khả dụng (chưa được gán)
 */
const getAvailableRfids = async (req, res) => {
    try {
        const result = await adminService.rfidService.getAvailableRfids();
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in getAvailableRfids controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API lấy tất cả người dùng khả dụng (chưa được gán RFID)
 */
const getAvailableUsers = async (req, res) => {
    try {
        const result = await adminService.userService.getAvailableUsersForRfid();
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in getAvailableUsers controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API lấy tất cả gán RFID có phân trang
 */
const getAllRfidUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await adminService.rfidUserService.getAllRfidUsersWithPagination(search, page, limit);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in getAllRfidUsers controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API gán RFID cho người dùng
 */
const assignRfidToUser = async (req, res) => {
    try {
        const { rfidId, userId } = req.body;
        const result = await adminService.rfidUserService.assignRfidToUser(rfidId, userId);
        return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        console.error('Error in assignRfidToUser controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API hủy gán RFID
 */
const unassignRfid = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.rfidUserService.unassignRfid(id);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in unassignRfid controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API kích hoạt lại gán RFID
 */
const reactivateRfidUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.rfidUserService.reactivateRfidUser(id);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in reactivateRfidUser controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API xóa gán RFID
 */
const deleteRfidUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.rfidUserService.deleteRfidUser(id);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in deleteRfidUser controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

/**
 * API cập nhật gán RFID
 */
const updateRfidUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { rfidId, userId } = req.body;
        
        const result = await adminService.rfidUserService.updateRfidUser(id, rfidId, userId);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error in updateRfidUser controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    showRfidManagement,
    getAllRfids,
    getRfidById,
    checkDuplicateRfid,
    createRfid,
    updateRfid,
    deleteRfid,
    getAvailableRfids,
    getAvailableUsers,
    getAllRfidUsers,
    assignRfidToUser,
    unassignRfid,
    reactivateRfidUser,
    deleteRfidUser,
    updateRfidUser
};