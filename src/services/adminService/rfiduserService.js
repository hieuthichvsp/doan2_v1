const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Lấy danh sách gán RFID
 */
const getAllRfidUsers = async () => {
    try {
        const rfidUsers = await model.RfidUser.findAll({
            include: [
                {
                    model: model.Rfid,
                    as: 'rfid'
                },
                {
                    model: model.User,
                    as: 'user'
                }
            ],
            order: [['id', 'DESC']]
        });
        
        return {
            success: true,
            data: rfidUsers
        };
    } catch (error) {
        console.error('Error in getAllRfidUsers service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách gán RFID'
        };
    }
};

/**
 * Lấy danh sách gán RFID có phân trang
 */
const getAllRfidUsersWithPagination = async (search, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        
        // Build the where clause for searching
        let whereClause = {};
        
        if (search) {
            whereClause = {
                [Op.or]: [
                    { '$rfid.code$': { [Op.like]: `%${search}%` } },
                    { '$user.name$': { [Op.like]: `%${search}%` } },
                    { '$user.user_code$': { [Op.like]: `%${search}%` } },
                    { '$user.email$': { [Op.like]: `%${search}%` } }
                ]
            };
        }
        
        const { count, rows } = await model.RfidUser.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: model.Rfid,
                    as: 'rfid',
                    required: true
                },
                {
                    model: model.User,
                    as: 'user',
                    required: true
                }
            ],
            order: [['id', 'DESC']],
            offset,
            limit,
            distinct: true
        });
        
        return {
            success: true,
            data: rows,
            total: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        };
    } catch (error) {
        console.error('Error in getAllRfidUsersWithPagination service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách gán RFID'
        };
    }
};

/**
 * Gán RFID cho người dùng
 */
const assignRfidToUser = async (rfidId, userId) => {
    try {
        // Check if RFID exists
        const rfid = await model.Rfid.findByPk(rfidId);
        if (!rfid) {
            return {
                success: false,
                message: 'Không tìm thấy RFID'
            };
        }
        
        // Check if user exists
        const user = await model.User.findByPk(userId);
        if (!user) {
            return {
                success: false,
                message: 'Không tìm thấy người dùng'
            };
        }
        
        // Check if RFID is already assigned to another user
        const existingAssignment = await model.RfidUser.findOne({
            where: {
                rfid_id: rfidId,
                status: true
            }
        });
        
        if (existingAssignment) {
            return {
                success: false,
                message: 'RFID này đã được gán cho người dùng khác'
            };
        }
        
        // Check if user already has an active RFID
        const existingUserRfid = await model.RfidUser.findOne({
            where: {
                student_id: userId,
                status: true
            }
        });
        
        if (existingUserRfid) {
            return {
                success: false,
                message: 'Người dùng này đã được gán RFID'
            };
        }
        
        // Kiểm tra xem đã có bản ghi cặp RFID-User này chưa (kể cả đã vô hiệu)
        const existingPair = await model.RfidUser.findOne({
            where: {
                rfid_id: rfidId,
                student_id: userId
            }
        });
        
        if (existingPair) {
            // Nếu đã tồn tại bản ghi, cập nhật trạng thái thành active
            await existingPair.update({ status: true });
            
            return {
                success: true,
                data: existingPair,
                message: 'Kích hoạt lại gán RFID thành công'
            };
        }
        
        // Create new RFID-User assignment
        const newRfidUser = await model.RfidUser.create({
            rfid_id: rfidId,
            student_id: userId,
            status: true
        });
        
        return {
            success: true,
            data: newRfidUser,
            message: 'Gán RFID thành công'
        };
    } catch (error) {
        console.error('Error in assignRfidToUser service:', error);
        return {
            success: false,
            message: 'Không thể gán RFID cho người dùng'
        };
    }
};

/**
 * Hủy gán RFID cho người dùng
 */
const unassignRfid = async (id) => {
    try {
        const rfidUser = await model.RfidUser.findByPk(id);
        
        if (!rfidUser) {
            return {
                success: false,
                message: 'Không tìm thấy thông tin gán RFID'
            };
        }
        
        if (!rfidUser.status) {
            return {
                success: false,
                message: 'RFID này đã được hủy gán trước đó'
            };
        }
        
        await rfidUser.update({ status: false });
        
        return {
            success: true,
            message: 'Hủy gán RFID thành công'
        };
    } catch (error) {
        console.error('Error in unassignRfid service:', error);
        return {
            success: false,
            message: 'Không thể hủy gán RFID'
        };
    }
};

/**
 * Kích hoạt lại gán RFID đã bị vô hiệu
 */
const reactivateRfidUser = async (id) => {
    try {
        const rfidUser = await model.RfidUser.findByPk(id);
        
        if (!rfidUser) {
            return {
                success: false,
                message: 'Không tìm thấy thông tin gán RFID'
            };
        }
        
        if (rfidUser.status) {
            return {
                success: false,
                message: 'RFID này đã đang hoạt động'
            };
        }
        
        // Kiểm tra xem RFID này đã được gán cho người dùng khác chưa
        const activeRfidAssignment = await model.RfidUser.findOne({
            where: {
                rfid_id: rfidUser.rfid_id,
                status: true
            }
        });
        
        if (activeRfidAssignment) {
            return {
                success: false,
                message: 'RFID này đã được gán cho người dùng khác'
            };
        }
        
        // Kiểm tra xem người dùng này đã được gán RFID khác chưa
        const activeUserRfid = await model.RfidUser.findOne({
            where: {
                student_id: rfidUser.student_id,
                status: true
            }
        });
        
        if (activeUserRfid) {
            return {
                success: false,
                message: 'Người dùng này đã được gán RFID khác'
            };
        }
        
        await rfidUser.update({ status: true });
        
        return {
            success: true,
            message: 'Kích hoạt lại gán RFID thành công'
        };
    } catch (error) {
        console.error('Error in reactivateRfidUser service:', error);
        return {
            success: false,
            message: 'Không thể kích hoạt lại gán RFID'
        };
    }
};

/**
 * Xóa gán RFID
 */
const deleteRfidUser = async (id) => {
    try {
        const rfidUser = await model.RfidUser.findByPk(id);
        
        if (!rfidUser) {
            return {
                success: false,
                message: 'Không tìm thấy thông tin gán RFID'
            };
        }
        
        await rfidUser.destroy();
        
        return {
            success: true,
            message: 'Xóa gán RFID thành công'
        };
    } catch (error) {
        console.error('Error in deleteRfidUser service:', error);
        return {
            success: false,
            message: 'Không thể xóa gán RFID'
        };
    }
};

/**
 * Cập nhật gán RFID
 */
const updateRfidUser = async (id, rfidId, userId) => {
    try {
        // Tìm bản ghi cần cập nhật
        const rfidUser = await model.RfidUser.findByPk(id);
        
        if (!rfidUser) {
            return {
                success: false,
                message: 'Không tìm thấy thông tin gán RFID'
            };
        }
        
        // Kiểm tra RFID và User tồn tại
        const rfid = await model.Rfid.findByPk(rfidId);
        if (!rfid) {
            return {
                success: false,
                message: 'Không tìm thấy RFID'
            };
        }
        
        const user = await model.User.findByPk(userId);
        if (!user) {
            return {
                success: false,
                message: 'Không tìm thấy người dùng'
            };
        }
        
        // Kiểm tra RFID này đã được gán cho người khác chưa (ngoại trừ bản ghi hiện tại)
        const existingRfidAssignment = await model.RfidUser.findOne({
            where: {
                rfid_id: rfidId,
                status: true,
                id: { [model.Sequelize.Op.ne]: id }
            }
        });
        
        if (existingRfidAssignment) {
            return {
                success: false,
                message: 'RFID này đã được gán cho người dùng khác'
            };
        }
        
        // Kiểm tra người dùng này đã được gán RFID khác chưa (ngoại trừ bản ghi hiện tại)
        const existingUserAssignment = await model.RfidUser.findOne({
            where: {
                student_id: userId,
                status: true,
                id: { [model.Sequelize.Op.ne]: id }
            }
        });
        
        if (existingUserAssignment) {
            return {
                success: false,
                message: 'Người dùng này đã được gán RFID khác'
            };
        }
        
        // Cập nhật thông tin
        await rfidUser.update({
            rfid_id: rfidId,
            student_id: userId,
            status: true
        });
        
        return {
            success: true,
            data: rfidUser,
            message: 'Cập nhật gán RFID thành công'
        };
    } catch (error) {
        console.error('Error in updateRfidUser service:', error);
        return {
            success: false,
            message: 'Không thể cập nhật gán RFID'
        };
    }
};

module.exports = {
    getAllRfidUsers,
    getAllRfidUsersWithPagination,
    assignRfidToUser,
    unassignRfid,
    reactivateRfidUser,  // Thêm method mới
    deleteRfidUser,
    updateRfidUser
};