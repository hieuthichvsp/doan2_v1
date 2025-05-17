const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Lấy danh sách tất cả môn học
 */
const getAllSubjects = async () => {
    try {
        const subjects = await model.Subject.findAll({
            order: [['id', 'ASC']]
        });
        return subjects;
    } catch (error) {
        console.error('Service error - getAllSubjects:', error);
        throw error;
    }
};

/**
 * Lấy danh sách môn học có phân trang
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const getAllSubjectsWithPagination = async (limit, offset) => {
    try {
        const { count, rows: subjects } = await model.Subject.findAndCountAll({
            order: [['id', 'ASC']],
            limit,
            offset
        });
        return { subjects, count };
    } catch (error) {
        console.error('Service error - getAllSubjectsWithPagination:', error);
        throw error;
    }
};

/**
 * Tìm kiếm môn học theo mã
 * @param {string} code - Mã môn học cần tìm
 */
const searchSubjectsByCode = async (code) => {
    try {
        const subjects = await model.Subject.findAll({
            where: {
                sub_code: {
                    [Op.like]: `%${code}%`
                }
            },
            order: [['id', 'ASC']]
        });
        return subjects;
    } catch (error) {
        console.error(`Service error - searchSubjectsByCode(${code}):`, error);
        throw error;
    }
};

/**
 * Tìm kiếm môn học theo mã có phân trang
 * @param {string} code - Mã môn học cần tìm
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const searchSubjectsByCodeWithPagination = async (code, limit, offset) => {
    try {
        const { count, rows: subjects } = await model.Subject.findAndCountAll({
            where: {
                sub_code: {
                    [Op.like]: `%${code}%`
                }
            },
            order: [['id', 'ASC']],
            limit,
            offset
        });
        return { subjects, count };
    } catch (error) {
        console.error(`Service error - searchSubjectsByCodeWithPagination(${code}):`, error);
        throw error;
    }
};

/**
 * Lấy thông tin môn học theo ID
 * @param {number} id - ID của môn học cần lấy
 */
const getSubjectById = async (id) => {
    try {
        const subject = await model.Subject.findByPk(id);
        if (!subject) {
            throw new Error(`Không tìm thấy môn học với ID: ${id}`);
        }
        return subject;
    } catch (error) {
        console.error(`Service error - getSubjectById(${id}):`, error);
        throw error;
    }
};

/**
 * Tạo môn học mới
 * @param {Object} data - Dữ liệu môn học mới
 */
const createSubject = async (data) => {
    try {
        // Kiểm tra trùng mã môn học
        const existingSubject = await model.Subject.findOne({
            where: { sub_code: data.sub_code }
        });

        if (existingSubject) {
            return {
                success: false,
                message: `Mã môn học ${data.sub_code} đã tồn tại`
            };
        }

        const newSubject = await model.Subject.create({
            sub_code: data.sub_code,
            name: data.name,
            credit: data.credit
        });

        return {
            success: true,
            subject: newSubject
        };
    } catch (error) {
        console.error('Service error - createSubject:', error);
        throw error;
    }
};

/**
 * Cập nhật thông tin môn học
 * @param {number} id - ID của môn học cần cập nhật
 * @param {Object} data - Dữ liệu cập nhật
 */
const updateSubject = async (id, data) => {
    try {
        const subject = await model.Subject.findByPk(id);
        if (!subject) {
            return {
                success: false,
                message: `Không tìm thấy môn học với ID: ${id}`
            };
        }

        // Kiểm tra trùng mã môn học nếu có thay đổi mã
        if (data.sub_code !== subject.sub_code) {
            const existingSubject = await model.Subject.findOne({
                where: { sub_code: data.sub_code }
            });

            if (existingSubject) {
                return {
                    success: false,
                    message: `Mã môn học ${data.sub_code} đã tồn tại`
                };
            }
        }

        await subject.update({
            sub_code: data.sub_code,
            name: data.name,
            credit: data.credit
        });

        return {
            success: true,
            subject
        };
    } catch (error) {
        console.error(`Service error - updateSubject(${id}):`, error);
        throw error;
    }
};

/**
 * Xóa môn học
 * @param {number} id - ID của môn học cần xóa
 */
const deleteSubject = async (id) => {
    try {
        const subject = await model.Subject.findByPk(id);
        if (!subject) {
            return {
                success: false,
                message: `Không tìm thấy môn học với ID: ${id}`
            };
        }

        // Kiểm tra xem môn học có đang được sử dụng trong các lớp học không
        const classSessions = await model.ClassSession.findAll({
            where: { sub_id: id }
        });

        if (classSessions && classSessions.length > 0) {
            return {
                success: false,
                message: `Không thể xóa môn học này vì đang được sử dụng trong ${classSessions.length} lớp học`
            };
        }

        await subject.destroy();
        return {
            success: true,
            message: 'Xóa môn học thành công'
        };
    } catch (error) {
        console.error(`Service error - deleteSubject(${id}):`, error);
        throw error;
    }
};

/**
 * Kiểm tra trùng mã môn học
 * @param {string} code - Mã môn học cần kiểm tra
 * @param {number|null} excludeId - ID môn học cần loại trừ (nếu có)
 */
const checkDuplicateSubjectCode = async (code, excludeId = null) => {
    try {
        const whereClause = { sub_code: code };
        if (excludeId) {
            whereClause.id = { [Op.ne]: excludeId };
        }

        const existingSubject = await model.Subject.findOne({
            where: whereClause
        });

        return {
            exists: !!existingSubject,
            subject: existingSubject
        };
    } catch (error) {
        console.error(`Service error - checkDuplicateSubjectCode(${code}):`, error);
        throw error;
    }
};

module.exports = {
    getAllSubjects,
    getAllSubjectsWithPagination,
    searchSubjectsByCode,
    searchSubjectsByCodeWithPagination,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    checkDuplicateSubjectCode
};