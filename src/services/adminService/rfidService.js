const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Lấy danh sách tất cả RFID
 */
const getAllRfids = async () => {
    try {
        const rfids = await model.Rfid.findAll({
            include: [
                {
                    model: model.RfidUser,
                    as: 'rfidUsers',
                    include: {
                        model: model.User,
                        as: 'user'
                    }
                }
            ],
            order: [['id', 'DESC']]
        });
        
        return {
            success: true,
            data: rfids
        };
    } catch (error) {
        console.error('Error in getAllRfids service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách RFID'
        };
    }
};

/**
 * Lấy danh sách RFID có phân trang
 */
const getAllRfidsWithPagination = async (search, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        let where = {};
        
        console.log(`getAllRfidsWithPagination: search=${search}, page=${page}, limit=${limit}`);
        
        if (search) {
            where = {
                [Op.or]: [
                    { code: { [Op.like]: `%${search}%` } },
                    { id: isNaN(search) ? -1 : parseInt(search) }
                ]
            };
        }
        
        const { count, rows } = await model.Rfid.findAndCountAll({
            where,
            include: [
                {
                    model: model.RfidUser,
                    as: 'rfidUsers',
                    include: {
                        model: model.User,
                        as: 'user'
                    }
                }
            ],
            order: [['id', 'DESC']],
            offset,
            limit
        });
        
        const result = {
            success: true,
            data: rows,
            total: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        };
        
        console.log('Pagination result:', result);
        
        return result;
    } catch (error) {
        console.error('Error in getAllRfidsWithPagination service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách RFID'
        };
    }
};

/**
 * Lấy thông tin RFID theo ID
 */
const getRfidById = async (id) => {
    try {
        const rfid = await model.Rfid.findByPk(id, {
            include: [
                {
                    model: model.RfidUser,
                    as: 'rfidUsers',
                    include: {
                        model: model.User,
                        as: 'user'
                    }
                }
            ]
        });
        
        if (!rfid) {
            return {
                success: false,
                message: 'Không tìm thấy RFID'
            };
        }
        
        return {
            success: true,
            data: rfid
        };
    } catch (error) {
        console.error('Error in getRfidById service:', error);
        return {
            success: false,
            message: 'Không thể lấy thông tin RFID'
        };
    }
};

/**
 * Kiểm tra mã RFID đã tồn tại chưa
 */
const checkDuplicateRfid = async (code, excludeId = null) => {
    try {
        let where = { code };
        
        if (excludeId) {
            where.id = {
                [Op.ne]: excludeId
            };
        }
        
        const rfid = await model.Rfid.findOne({ where });
        
        return {
            success: true,
            isDuplicate: !!rfid
        };
    } catch (error) {
        console.error('Error in checkDuplicateRfid service:', error);
        return {
            success: false,
            message: 'Không thể kiểm tra mã RFID'
        };
    }
};

/**
 * Thêm mới RFID
 */
const createRfid = async (rfidData) => {
    try {
        // Check duplicate
        const existingRfid = await model.Rfid.findOne({
            where: { code: rfidData.code }
        });
        
        if (existingRfid) {
            return {
                success: false,
                message: 'Mã RFID đã tồn tại'
            };
        }
        
        const newRfid = await model.Rfid.create(rfidData);
        
        return {
            success: true,
            data: newRfid,
            message: 'Thêm mới RFID thành công'
        };
    } catch (error) {
        console.error('Error in createRfid service:', error);
        return {
            success: false,
            message: 'Không thể thêm mới RFID'
        };
    }
};

/**
 * Cập nhật RFID
 */
const updateRfid = async (id, rfidData) => {
    try {
        const rfid = await model.Rfid.findByPk(id);
        
        if (!rfid) {
            return {
                success: false,
                message: 'Không tìm thấy RFID'
            };
        }
        
        // Check duplicate
        if (rfid.code !== rfidData.code) {
            const existingRfid = await model.Rfid.findOne({
                where: { 
                    code: rfidData.code,
                    id: { [Op.ne]: id }
                }
            });
            
            if (existingRfid) {
                return {
                    success: false,
                    message: 'Mã RFID đã tồn tại'
                };
            }
        }
        
        await rfid.update(rfidData);
        
        return {
            success: true,
            data: rfid,
            message: 'Cập nhật RFID thành công'
        };
    } catch (error) {
        console.error('Error in updateRfid service:', error);
        return {
            success: false,
            message: 'Không thể cập nhật RFID'
        };
    }
};

/**
 * Xóa RFID
 */
const deleteRfid = async (id) => {
    try {
        const rfid = await model.Rfid.findByPk(id, {
            include: [
                {
                    model: model.RfidUser,
                    as: 'rfidUsers'
                }
            ]
        });
        
        if (!rfid) {
            return {
                success: false,
                message: 'Không tìm thấy RFID'
            };
        }
        
        // Check if RFID is assigned to any active user
        const activeAssignment = rfid.rfidUsers && rfid.rfidUsers.find(ru => ru.status === true);
        if (activeAssignment) {
            return {
                success: false,
                message: 'Không thể xóa RFID đang được gán cho người dùng'
            };
        }
        
        await rfid.destroy();
        
        return {
            success: true,
            message: 'Xóa RFID thành công'
        };
    } catch (error) {
        console.error('Error in deleteRfid service:', error);
        return {
            success: false,
            message: 'Không thể xóa RFID'
        };
    }
};

/**
 * Lấy danh sách RFID chưa được gán cho người dùng
 */
const getAvailableRfids = async () => {
    try {
        const rfids = await model.Rfid.findAll({
            include: [
                {
                    model: model.RfidUser,
                    as: 'rfidUsers',
                    required: false
                }
            ],
            order: [['code', 'ASC']]
        });
        
        // Filter out RFIDs that are already assigned to active users
        const availableRfids = rfids.filter(rfid => {
            return !rfid.rfidUsers || !rfid.rfidUsers.some(ru => ru.status === true);
        });
        
        return {
            success: true,
            data: availableRfids
        };
    } catch (error) {
        console.error('Error in getAvailableRfids service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách RFID khả dụng'
        };
    }
};

module.exports = {
    getAllRfids,
    getAllRfidsWithPagination,
    getRfidById,
    checkDuplicateRfid,
    createRfid,
    updateRfid,
    deleteRfid,
    getAvailableRfids
};