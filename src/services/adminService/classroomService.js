const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Lấy danh sách tất cả lớp học
 */
const getAllClassrooms = async () => {
    try {
        const classrooms = await model.Class.findAll({
            order: [['id', 'ASC']]
        });
        return classrooms;
    } catch (error) {
        console.error('Service error - getAllClassrooms:', error);
        throw error;
    }
};

/**
 * Lấy danh sách lớp học có phân trang
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const getAllClassroomsWithPagination = async (limit, offset) => {
    try {
        const { count, rows: classrooms } = await model.Class.findAndCountAll({
            order: [['id', 'ASC']],
            limit,
            offset
        });
        return { classrooms, count };
    } catch (error) {
        console.error('Service error - getAllClassroomsWithPagination:', error);
        throw error;
    }
};

/**
 * Tìm kiếm lớp học theo mã
 * @param {string} code - Mã lớp học cần tìm
 */
const searchClassroomsByCode = async (code) => {
    try {
        const classrooms = await model.Class.findAll({
            where: {
                room_code: {
                    [Op.like]: `%${code}%`
                }
            },
            order: [['id', 'ASC']]
        });
        return classrooms;
    } catch (error) {
        console.error(`Service error - searchClassroomsByCode(${code}):`, error);
        throw error;
    }
};

/**
 * Tìm kiếm lớp học theo mã có phân trang
 * @param {string} code - Mã lớp học cần tìm
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const searchClassroomsByCodeWithPagination = async (code, limit, offset) => {
    try {
        const { count, rows: classrooms } = await model.Class.findAndCountAll({
            where: {
                room_code: {
                    [Op.like]: `%${code}%`
                }
            },
            order: [['id', 'ASC']],
            limit,
            offset
        });
        return { classrooms, count };
    } catch (error) {
        console.error(`Service error - searchClassroomsByCodeWithPagination(${code}):`, error);
        throw error;
    }
};

/**
 * Lấy thông tin lớp học theo ID
 * @param {number} id - ID của lớp học cần lấy
 */
const getClassroomById = async (id) => {
    try {
        const classroom = await model.Class.findByPk(id);
        if (!classroom) {
            throw new Error(`Không tìm thấy lớp học với ID: ${id}`);
        }
        return classroom;
    } catch (error) {
        console.error(`Service error - getClassroomById(${id}):`, error);
        throw error;
    }
};

/**
 * Tạo lớp học mới
 * @param {Object} data - Dữ liệu lớp học mới
 */
const createClassroom = async (data) => {
    try {
        // Kiểm tra trùng mã lớp học
        const existingClassroom = await model.Class.findOne({
            where: { room_code: data.room_code }
        });

        if (existingClassroom) {
            return {
                success: false,
                message: `Mã lớp học ${data.room_code} đã tồn tại`
            };
        }

        const newClassroom = await model.Class.create({
            room_code: data.room_code,
            name: data.name,
            capacity: data.capacity,
            type: data.type
        });

        return {
            success: true,
            classroom: newClassroom
        };
    } catch (error) {
        console.error('Service error - createClassroom:', error);
        throw error;
    }
};

/**
 * Cập nhật thông tin lớp học
 * @param {number} id - ID của lớp học cần cập nhật
 * @param {Object} data - Dữ liệu cập nhật
 */
const updateClassroom = async (id, data) => {
    try {
        const classroom = await model.Class.findByPk(id);
        if (!classroom) {
            return {
                success: false,
                message: `Không tìm thấy lớp học với ID: ${id}`
            };
        }

        // Kiểm tra trùng mã lớp học nếu có thay đổi mã
        if (data.room_code !== classroom.room_code) {
            const existingClassroom = await model.Class.findOne({
                where: { room_code: data.room_code }
            });

            if (existingClassroom) {
                return {
                    success: false,
                    message: `Mã lớp học ${data.room_code} đã tồn tại`
                };
            }
        }

        await classroom.update({
            room_code: data.room_code,
            name: data.name,
            capacity: data.capacity,
            type: data.type
        });

        return {
            success: true,
            classroom
        };
    } catch (error) {
        console.error(`Service error - updateClassroom(${id}):`, error);
        throw error;
    }
};

/**
 * Xóa lớp học
 * @param {number} id - ID của lớp học cần xóa
 */
const deleteClassroom = async (id) => {
    try {
        const classroom = await model.Class.findByPk(id);
        if (!classroom) {
            return {
                success: false,
                message: `Không tìm thấy lớp học với ID: ${id}`
            };
        }

        // Kiểm tra xem lớp học có đang được sử dụng không
        const classSessions = await model.ClassSession.findAll({
            where: { class_id: id }
        });

        if (classSessions && classSessions.length > 0) {
            return {
                success: false,
                message: `Không thể xóa lớp học này vì đang được sử dụng trong ${classSessions.length} buổi học`
            };
        }

        // Kiểm tra xem lớp học có thiết bị không
        const devices = await model.Device.findAll({
            where: { class_id: id }
        });

        if (devices && devices.length > 0) {
            return {
                success: false,
                message: `Không thể xóa lớp học này vì có ${devices.length} thiết bị đang được gắn với lớp học`
            };
        }

        await classroom.destroy();
        return {
            success: true,
            message: 'Xóa lớp học thành công'
        };
    } catch (error) {
        console.error(`Service error - deleteClassroom(${id}):`, error);
        throw error;
    }
};

/**
 * Kiểm tra mã lớp học đã tồn tại hay chưa
 * @param {string} roomCode - Mã lớp học cần kiểm tra
 * @param {number} excludeId - ID lớp học cần loại trừ khi kiểm tra (dùng khi cập nhật)
 */
const checkDuplicateRoomCode = async (roomCode, excludeId = null) => {
    try {
        const whereClause = { room_code: roomCode };
        if (excludeId) {
            whereClause.id = { [Op.ne]: excludeId };
        }

        const existingClassroom = await model.Class.findOne({
            where: whereClause
        });

        return {
            exists: !!existingClassroom,
            classroom: existingClassroom
        };
    } catch (error) {
        console.error(`Service error - checkDuplicateRoomCode(${roomCode}):`, error);
        throw error;
    }
};

module.exports = {
    getAllClassrooms,
    getAllClassroomsWithPagination,
    searchClassroomsByCode,
    searchClassroomsByCodeWithPagination,
    getClassroomById,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    checkDuplicateRoomCode
};