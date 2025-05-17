const { Op } = require('sequelize');
const model = require('../../models');

/**
 * Xử lý phân trang
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số mục trên mỗi trang
 * @returns {Object} - offset và pageLimit
 */
const handlePagination = (page, limit) => {
    const pageSize = limit || 10;  // Default limit là 10
    const currentPage = page || 1; // Default page là 1
    const offset = (currentPage - 1) * pageSize;

    return {
        offset,
        pageLimit: pageSize
    };
};

/**
 * Xử lý dữ liệu phân trang
 * @param {Array} data - Dữ liệu đã phân trang
 * @param {number} count - Tổng số bản ghi
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số mục trên mỗi trang
 * @returns {Object} - Dữ liệu phân trang
 */
const handlePagingData = (data, count, page, limit) => {
    const currentPage = page || 1;
    const pageSize = limit || 10;
    const totalItems = count;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
        totalItems,
        enrollments: data,
        totalPages,
        currentPage,
        limit: pageSize
    };
};

/**
 * Lấy danh sách tất cả đăng ký môn học
 */
const getAllEnrollments = async () => {
    try {
        return await model.Enrollment.findAll({
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        { model: model.Subject, as: 'subject' },
                        { model: model.Semester, as: 'semester' }
                    ]
                },
                {
                    model: model.User,
                    as: 'student'
                }
            ],
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('Service error - getAllEnrollments:', error);
        throw error;
    }
};

/**
 * Lấy danh sách đăng ký môn học có phân trang
 */
const getAllEnrollmentsWithPagination = async (limit, offset) => {
    try {
        const { count, rows } = await model.Enrollment.findAndCountAll({
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        { model: model.Subject, as: 'subject' },
                        { model: model.Semester, as: 'semester' }
                    ]
                },
                {
                    model: model.User,
                    as: 'student'
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return { enrollments: rows, count };
    } catch (error) {
        console.error('Service error - getAllEnrollmentsWithPagination:', error);
        throw error;
    }
};

/**
 * Tìm kiếm đăng ký môn học theo mã sinh viên hoặc lớp học phần
 */
const searchEnrollmentsWithPagination = async (studentCode = '', classSessionId = '', limit, offset) => {
    try {
        const whereCondition = {};
        const includeConditions = [
            {
                model: model.ClassSession,
                as: 'classSession',
                include: [
                    { model: model.Subject, as: 'subject' },
                    { model: model.Semester, as: 'semester' }
                ]
            },
            {
                model: model.User,
                as: 'student',
                where: studentCode ? { user_code: { [Op.like]: `%${studentCode}%` } } : {}
            }
        ];

        if (classSessionId) {
            whereCondition.id_classsession = classSessionId;
        }

        const { count, rows } = await model.Enrollment.findAndCountAll({
            where: whereCondition,
            include: includeConditions,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return { enrollments: rows, count };
    } catch (error) {
        console.error('Service error - searchEnrollmentsWithPagination:', error);
        throw error;
    }
};

/**
 * Lấy chi tiết đăng ký môn học theo ID
 */
const getEnrollmentById = async (id) => {
    try {
        return await model.Enrollment.findByPk(id, {
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        { model: model.Subject, as: 'subject' },
                        { model: model.Semester, as: 'semester' }
                    ]
                },
                {
                    model: model.User,
                    as: 'student'
                }
            ]
        });
    } catch (error) {
        console.error(`Service error - getEnrollmentById(${id}):`, error);
        throw error;
    }
};

/**
 * Tạo đăng ký môn học mới
 */
const createEnrollment = async (enrollmentData) => {
    const t = await model.sequelize.transaction();
    
    try {
        // Kiểm tra xem sinh viên đã đăng ký học phần này chưa
        const existingEnrollment = await model.Enrollment.findOne({
            where: {
                id_classsession: enrollmentData.id_classsession,
                id_student: enrollmentData.id_student
            },
            transaction: t
        });

        if (existingEnrollment) {
            await t.rollback();
            throw new Error('Sinh viên đã đăng ký học phần này');
        }

        // Kiểm tra sức chứa của lớp học phần
        const classSession = await model.ClassSession.findByPk(enrollmentData.id_classsession, { transaction: t });
        if (!classSession) {
            await t.rollback();
            throw new Error('Không tìm thấy lớp học phần');
        }

        const enrollmentCount = await model.Enrollment.count({
            where: { id_classsession: enrollmentData.id_classsession },
            transaction: t
        });

        if (enrollmentCount >= classSession.capacity) {
            await t.rollback();
            throw new Error(`Lớp học phần đã đạt sức chứa tối đa (${classSession.capacity} sinh viên)`);
        }

        // Tạo đăng ký mới
        const newEnrollment = await model.Enrollment.create(enrollmentData, { transaction: t });

        // Lấy dữ liệu đầy đủ của đăng ký để trả về
        const enrollmentWithDetails = await model.Enrollment.findByPk(newEnrollment.id, {
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        { model: model.Subject, as: 'subject' },
                        { model: model.Semester, as: 'semester' }
                    ]
                },
                {
                    model: model.User,
                    as: 'student'
                }
            ],
            transaction: t
        });

        await t.commit();
        return enrollmentWithDetails;
    } catch (error) {
        await t.rollback();
        console.error('Service error - createEnrollment:', error);
        throw error;
    }
};

/**
 * Xóa đăng ký môn học
 */
const deleteEnrollment = async (id) => {
    try {
        const enrollment = await model.Enrollment.findByPk(id);
        if (!enrollment) {
            throw new Error('Không tìm thấy đăng ký môn học');
        }

        await enrollment.destroy();
        return true;
    } catch (error) {
        console.error(`Service error - deleteEnrollment(${id}):`, error);
        throw error;
    }
};

/**
 * Đăng ký hàng loạt sinh viên vào một học phần
 */
const bulkEnroll = async (classSessionId, studentIds) => {
    const t = await model.sequelize.transaction();
    
    try {
        // Kiểm tra lớp học phần tồn tại
        const classSession = await model.ClassSession.findByPk(classSessionId, { transaction: t });
        if (!classSession) {
            await t.rollback();
            return { success: false, message: 'Không tìm thấy lớp học phần' };
        }

        // Kiểm tra sức chứa của lớp
        const currentEnrollmentCount = await model.Enrollment.count({
            where: { id_classsession: classSessionId },
            transaction: t
        });

        const remainingSlots = classSession.capacity - currentEnrollmentCount;
        
        if (remainingSlots < studentIds.length) {
            await t.rollback();
            return { 
                success: false, 
                message: `Lớp học phần chỉ còn ${remainingSlots} chỗ trống, không thể đăng ký cho ${studentIds.length} sinh viên` 
            };
        }

        // Tìm các sinh viên đã đăng ký trước đó
        const existingEnrollments = await model.Enrollment.findAll({
            where: {
                id_classsession: classSessionId,
                id_student: { [Op.in]: studentIds }
            },
            transaction: t
        });

        // Lọc ra các sinh viên chưa đăng ký
        const existingStudentIds = existingEnrollments.map(e => e.id_student);
        const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));

        // Tạo mảng dữ liệu đăng ký mới
        const enrollmentsToCreate = newStudentIds.map(studentId => ({
            id_classsession: classSessionId,
            id_student: studentId
        }));

        // Thực hiện đăng ký hàng loạt
        if (enrollmentsToCreate.length > 0) {
            await model.Enrollment.bulkCreate(enrollmentsToCreate, { transaction: t });
        }

        await t.commit();
        
        // Trả về kết quả chi tiết
        return {
            success: true,
            message: `Đã đăng ký thành công cho ${enrollmentsToCreate.length} sinh viên`,
            details: {
                totalRequested: studentIds.length,
                totalEnrolled: enrollmentsToCreate.length,
                alreadyEnrolled: existingStudentIds.length,
                newlyEnrolled: enrollmentsToCreate.length
            }
        };
    } catch (error) {
        await t.rollback();
        console.error('Service error - bulkEnroll:', error);
        throw error;
    }
};

module.exports = {
    handlePagination,
    getAllEnrollments,
    getAllEnrollmentsWithPagination,
    searchEnrollmentsWithPagination,
    getEnrollmentById,
    createEnrollment,
    deleteEnrollment,
    bulkEnroll
};