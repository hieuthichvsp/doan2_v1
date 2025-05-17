const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Lấy tất cả các thiết bị
 */
const getAllDevices = async () => {
    try {
        const devices = await model.Device.findAll({
            include: [{
                model: model.Class,
                as: 'class'
            }],
            order: [['id', 'DESC']]
        });
        
        return {
            success: true,
            data: devices
        };
    } catch (error) {
        console.error('Error in getAllDevices service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách thiết bị'
        };
    }
};

/**
 * Lấy thiết bị theo ID
 */
const getDeviceById = async (id) => {
    try {
        const device = await model.Device.findByPk(id, {
            include: [{
                model: model.Class,
                as: 'class'
            }]
        });
        
        if (!device) {
            return {
                success: false,
                message: 'Không tìm thấy thiết bị'
            };
        }
        
        return {
            success: true,
            data: device
        };
    } catch (error) {
        console.error('Error in getDeviceById service:', error);
        return {
            success: false,
            message: 'Không thể lấy thông tin thiết bị'
        };
    }
};

/**
 * Lấy danh sách thiết bị có phân trang
 */
const getAllDevicesWithPagination = async (search, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        let where = {};
        
        if (search) {
            where = {
                [Op.or]: [
                    { device_code: { [Op.like]: `%${search}%` } },
                    { name: { [Op.like]: `%${search}%` } },
                    { location: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        
        const { count, rows } = await model.Device.findAndCountAll({
            where,
            include: [{
                model: model.Class,
                as: 'class'
            }],
            order: [['id', 'DESC']],
            offset,
            limit
        });
        
        return {
            success: true,
            data: rows,
            total: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        };
    } catch (error) {
        console.error('Error in getAllDevicesWithPagination service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách thiết bị'
        };
    }
};

/**
 * Kiểm tra mã thiết bị trùng lặp
 */
const checkDuplicateDeviceCode = async (deviceCode, excludeId = null) => {
    try {
        let where = { device_code: deviceCode };
        
        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }
        
        const device = await model.Device.findOne({ where });
        
        return {
            success: true,
            isDuplicate: !!device
        };
    } catch (error) {
        console.error('Error in checkDuplicateDeviceCode service:', error);
        return {
            success: false,
            message: 'Không thể kiểm tra mã thiết bị'
        };
    }
};

/**
 * Tạo mới thiết bị
 */
const createDevice = async (deviceData) => {
    try {
        // Kiểm tra mã thiết bị trùng lặp
        const existingDevice = await model.Device.findOne({
            where: { device_code: deviceData.device_code }
        });
        
        if (existingDevice) {
            return {
                success: false,
                message: 'Mã thiết bị đã tồn tại'
            };
        }
        
        const newDevice = await model.Device.create(deviceData);
        
        // Load class relation if class_id is provided
        if (deviceData.class_id) {
            await newDevice.reload({
                include: [{
                    model: model.Class,
                    as: 'class'
                }]
            });
        }
        
        return {
            success: true,
            data: newDevice,
            message: 'Thiết bị đã được tạo thành công'
        };
    } catch (error) {
        console.error('Error in createDevice service:', error);
        return {
            success: false,
            message: 'Không thể tạo thiết bị'
        };
    }
};

/**
 * Cập nhật thiết bị
 */
const updateDevice = async (id, deviceData) => {
    try {
        const device = await model.Device.findByPk(id);
        
        if (!device) {
            return {
                success: false,
                message: 'Không tìm thấy thiết bị'
            };
        }
        
        // Kiểm tra mã thiết bị trùng lặp nếu đã thay đổi
        if (device.device_code !== deviceData.device_code) {
            const existingDevice = await model.Device.findOne({
                where: {
                    device_code: deviceData.device_code,
                    id: { [Op.ne]: id }
                }
            });
            
            if (existingDevice) {
                return {
                    success: false,
                    message: 'Mã thiết bị đã tồn tại'
                };
            }
        }
        
        await device.update(deviceData);
        
        // Reload with class relation
        await device.reload({
            include: [{
                model: model.Class,
                as: 'class'
            }]
        });
        
        return {
            success: true,
            data: device,
            message: 'Thiết bị đã được cập nhật thành công'
        };
    } catch (error) {
        console.error('Error in updateDevice service:', error);
        return {
            success: false,
            message: 'Không thể cập nhật thiết bị'
        };
    }
};

/**
 * Xóa thiết bị
 */
const deleteDevice = async (id) => {
    try {
        const device = await model.Device.findByPk(id);
        
        if (!device) {
            return {
                success: false,
                message: 'Không tìm thấy thiết bị'
            };
        }
        
        await device.destroy();
        
        return {
            success: true,
            message: 'Thiết bị đã được xóa thành công'
        };
    } catch (error) {
        console.error('Error in deleteDevice service:', error);
        return {
            success: false,
            message: 'Không thể xóa thiết bị'
        };
    }
};

/**
 * Lấy danh sách các lớp học có thể gán thiết bị
 */
const getAvailableClasses = async () => {
    try {
        const classes = await model.Class.findAll({
            order: [['room_code', 'ASC']]
        });
        
        return {
            success: true,
            data: classes
        };
    } catch (error) {
        console.error('Error in getAvailableClasses service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách lớp học'
        };
    }
};

module.exports = {
    getAllDevices,
    getDeviceById,
    getAllDevicesWithPagination,
    checkDuplicateDeviceCode,
    createDevice,
    updateDevice,
    deleteDevice,
    getAvailableClasses
};