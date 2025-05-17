const { Op } = require('sequelize');
const model = require('../../models');

/**
 * Xử lý phân trang - Thay thế cho getPagination
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
 * Xử lý dữ liệu phân trang - Thay thế cho getPagingData
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
        classSessions: data,
        totalPages,
        currentPage,
        limit: pageSize
    };
};

/**
 * Lấy danh sách tất cả học phần với thông tin từ các bảng liên quan
 */
const getAllClassSessions = async (page, limit, searchTerm = '', filters = {}) => {
    try {
        const { offset, pageLimit } = handlePagination(page, limit);

        // Xây dựng điều kiện tìm kiếm
        const whereCondition = {};

        // Điều kiện tìm kiếm theo từ khóa
        if (searchTerm) {
            whereCondition[Op.or] = [
                { class_code: { [Op.like]: `%${searchTerm}%` } },
                { name: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        // Thêm điều kiện lọc theo loại học phần
        if (filters.type) {
            whereCondition.type = filters.type;
        }

        // Các điều kiện lọc theo quan hệ
        const includeConditions = [
            {
                model: model.Subject,
                as: 'subject',
                ...(filters.subject ? { where: { id: filters.subject } } : {})
            },
            {
                model: model.Semester,
                as: 'semester',
                ...(filters.semester ? { where: { id: filters.semester } } : {})
            },
            { model: model.Class, as: 'class' },
            { model: model.User, as: 'teacher', attributes: ['id', 'name'] }
        ];

        const { count, rows } = await model.ClassSession.findAndCountAll({
            where: whereCondition,
            include: includeConditions,
            order: [['createdAt', 'DESC']],
            offset,
            limit: pageLimit,
            distinct: true // Quan trọng để đếm đúng khi có include
        });

        // Tính số sinh viên đã đăng ký cho mỗi học phần
        const classSessionsWithEnrollments = await Promise.all(
            rows.map(async (session) => {
                const enrollmentCount = await model.Enrollment.count({
                    where: { id_classsession: session.id }
                });

                // Tính số buổi điểm danh đã tạo
                const attendanceCount = await model.AttendanceSession.count({
                    where: { class_session_id: session.id }
                });

                const formattedSession = {
                    ...session.toJSON(),
                    enrollmentCount,
                    attendanceCount,
                    remainingSlots: session.capacity - enrollmentCount
                };
                return formattedSession;
            })
        );

        return handlePagingData(classSessionsWithEnrollments, count, page, limit);
    } catch (error) {
        console.error('Error in getAllClassSessions service:', error);
        throw error;
    }
};

/**
 * Lấy chi tiết học phần theo ID
 */
const getClassSessionById = async (id) => {
    try {
        const classSession = await model.ClassSession.findByPk(id, {
            include: [
                { model: model.Subject, as: 'subject' },
                { model: model.Semester, as: 'semester' },
                { model: model.Class, as: 'class' },
                { model: model.User, as: 'teacher', attributes: ['id', 'name'] },
            ]
        });

        if (!classSession) {
            return { success: false, message: 'Không tìm thấy học phần' };
        }

        // Lấy số sinh viên đã đăng ký
        const enrollmentCount = await model.Enrollment.count({
            where: { id_classsession: classSession.id }
        });

        // Lấy số buổi điểm danh đã tạo
        const attendanceCount = await model.AttendanceSession.count({
            where: { class_session_id: classSession.id }
        });

        // Lấy danh sách lịch học của học phần
        const schedules = await model.Schedule.findAll({
            where: { id_class_session: classSession.id },
            include: [
                { model: model.Time, as: 'time' }
            ],
            order: [['weekday', 'ASC']]
        });

        // Chuyển đổi schedules thành plain objects để tránh circular references
        const plainSchedules = schedules.map(schedule => schedule.toJSON());

        // Chuyển đổi classSession thành plain object
        const plainClassSession = classSession.toJSON();

        return {
            success: true,
            classSession: {
                ...plainClassSession,
                enrollmentCount,
                attendanceCount,
                remainingSlots: plainClassSession.capacity - enrollmentCount,
                schedules: plainSchedules
            }
        };
    } catch (error) {
        console.error('Error in getClassSessionById service:', error);
        throw error;
    }
};

/**
 * Lấy danh sách sinh viên đã đăng ký học phần
 */
const getEnrolledStudents = async (classSessionId) => {
    try {
        const enrollments = await model.Enrollment.findAll({
            where: { id_classsession: classSessionId },
            include: [
                {
                    model: model.User,
                    as: 'student',
                    attributes: ['id', 'name', 'email', 'user_code']
                }
            ]
        });
        console.log('Enrollments:', enrollments); // Debug log
        // Thực hiện chuyển đổi dữ liệu để tránh circular references
        const plainEnrollments = enrollments.map(enrollment => {
            const plainEnrollment = enrollment.toJSON();
            return {
                ...plainEnrollment,
                student: {
                    ...plainEnrollment.student,
                    student_id: plainEnrollment.student.user_code // Map user_code thành student_id
                }
            };
        });

        return {
            success: true,
            enrollments: plainEnrollments
        };
    } catch (error) {
        console.error('Error in getEnrolledStudents service:', error);
        throw error;
    }
};

/**
 * Kiểm tra mã học phần trùng lặp
 */
const checkDuplicateClassCode = async (classCode, excludeId = null) => {
    try {
        const whereClause = { class_code: classCode };

        if (excludeId) {
            whereClause.id = { [Op.ne]: excludeId };
        }

        const count = await model.ClassSession.count({ where: whereClause });

        return {
            success: true,
            exists: count > 0
        };
    } catch (error) {
        console.error('Error in checkDuplicateClassCode service:', error);
        throw error;
    }
};

/**
 * Tạo học phần mới
 */
const createClassSession = async (classSessionData) => {
    try {
        // Kiểm tra trùng lặp mã học phần
        const isDuplicate = await checkDuplicateClassCode(classSessionData.class_code);
        if (isDuplicate.exists) {
            return { success: false, message: 'Mã học phần đã tồn tại' };
        }

        // Tạo học phần mới
        const newClassSession = await model.ClassSession.create(classSessionData);

        return {
            success: true,
            message: 'Tạo học phần thành công',
            classSession: newClassSession
        };
    } catch (error) {
        console.error('Error in createClassSession service:', error);
        throw error;
    }
};

/**
 * Cập nhật thông tin học phần
 */
const updateClassSession = async (id, classSessionData) => {
    try {
        // Tìm học phần theo ID
        const classSession = await model.ClassSession.findByPk(id);
        if (!classSession) {
            return { success: false, message: 'Không tìm thấy học phần' };
        }

        // Nếu mã học phần thay đổi, kiểm tra trùng lặp
        if (classSessionData.class_code !== classSession.class_code) {
            const isDuplicate = await checkDuplicateClassCode(classSessionData.class_code, id);
            if (isDuplicate.exists) {
                return { success: false, message: 'Mã học phần đã tồn tại' };
            }
        }

        // Kiểm tra nếu giảm sĩ số có ảnh hưởng đến sinh viên đã đăng ký không
        if (classSessionData.capacity < classSession.capacity) {
            const enrollmentCount = await model.Enrollment.count({
                where: { id_classsession: id }
            });

            if (classSessionData.capacity < enrollmentCount) {
                return {
                    success: false,
                    message: `Không thể giảm sĩ số xuống ${classSessionData.capacity} vì đã có ${enrollmentCount} sinh viên đăng ký`
                };
            }
        }

        // Tách dữ liệu lịch học và thông tin học phần
        const { schedules, deletedSchedules, ...updatedData } = classSessionData;
        
        // 1. Cập nhật thông tin học phần
        await classSession.update(updatedData);
        
        // 2. Xóa các lịch học đã chọn để xóa
        if (deletedSchedules && deletedSchedules.length > 0) {
            await model.Schedule.destroy({ 
                where: { id: { [Op.in]: deletedSchedules } } 
            });
        }
        
        // 3. Cập nhật hoặc thêm các lịch học mới
        if (schedules && schedules.length > 0) {
            for (const schedule of schedules) {
                if (schedule.id) {
                    // Cập nhật lịch học hiện có
                    await model.Schedule.update(
                        { weekday: schedule.weekday, id_time: schedule.id_time },
                        { where: { id: schedule.id } }
                    );
                } else {
                    // Thêm lịch học mới
                    await model.Schedule.create({
                        id_class_session: id,  // Sửa từ classsession_id thành id_class_session để khớp với tên trường trong model
                        weekday: schedule.weekday,
                        id_time: schedule.id_time
                    });
                }
            }
        }

        return {
            success: true,
            message: 'Cập nhật học phần thành công',
            classSession
        };
    } catch (error) {
        console.error('Error in updateClassSession service:', error);
        return {
            success: false,
            message: `Có lỗi xảy ra khi cập nhật học phần: ${error.message}`
        };
    }
};

/**
 * Xóa học phần
 */
const deleteClassSession = async (id) => {
    try {
        // Tìm học phần theo ID
        const classSession = await model.ClassSession.findByPk(id);
        if (!classSession) {
            return { success: false, message: 'Không tìm thấy học phần' };
        }

        // Xóa các lịch học liên quan
        await model.Schedule.destroy({
            where: { id_class_session: id }
        });
        
        // Xóa các đăng ký môn học liên quan (nếu có)
        await model.Enrollment.destroy({
            where: { id_classsession: id }
        });
        
        // Xóa điểm danh liên quan (nếu có)
        // Giả sử bảng Attendance có tham chiếu đến học phần
        if (model.Attendance) {
            await model.AttendanceSession.destroy({
                where: {class_session_id: id }
            });
        }

        // Cuối cùng xóa học phần
        await classSession.destroy();

        return {
            success: true,
            message: 'Xóa học phần thành công'
        };
    } catch (error) {
        console.error('Error in deleteClassSession service:', error);
        return {
            success: false,
            message: `Có lỗi xảy ra khi xóa học phần: ${error.message}`
        };
    }
};

/**
 * Lấy danh sách lịch học của học phần
 */
const getClassSessionSchedules = async (classSessionId) => {
    try {
        const schedules = await model.Schedule.findAll({
            where: { id_class_session: classSessionId },
            include: [
                { model: model.Time, as: 'time' }
                // Đã bỏ { model: model.Classroom, as: 'classroom' }
            ],
            order: [['weekday', 'ASC']] // Đã sửa từ 'date' thành 'weekday'
        });

        return {
            success: true,
            schedules
        };
    } catch (error) {
        console.error('Error in getClassSessionSchedules service:', error);
        throw error;
    }
};

const getClassSessionsWithSubjects = async () => {
    try {
        return await model.ClassSession.findAll({
            include: [
                {
                    model: model.Subject,
                    as: 'subject',
                    attributes: ['id', 'sub_code', 'name']
                }
            ],
            order: [['class_code', 'ASC']]
        });
    } catch (error) {
        console.error('Error in getClassSessionsWithSubjects service:', error);
        throw error;
    }
};

// Kiểm tra sức chứa lớp học phần
const checkClassSessionCapacity = async (classSessionId) => {
    try {
        // Lấy thông tin lớp học phần
        const classSession = await model.ClassSession.findByPk(classSessionId);
        if (!classSession) {
            throw new Error('Không tìm thấy lớp học phần');
        }
        
        // Đếm số lượng đăng ký
        const enrollmentCount = await model.Enrollment.count({
            where: { id_classsession: classSessionId }
        });
        
        return {
            classSessionId,
            capacity: classSession.capacity || 0,
            currentCount: enrollmentCount,
            available: (classSession.capacity || 0) - enrollmentCount
        };
    } catch (error) {
        console.error('Error in checkClassSessionCapacity service:', error);
        throw error;
    }
};

module.exports = {
    getAllClassSessions,
    getClassSessionById,
    getEnrolledStudents,
    checkDuplicateClassCode,
    createClassSession,
    updateClassSession,
    deleteClassSession,
    getClassSessionSchedules,
    getClassSessionsWithSubjects,
    checkClassSessionCapacity
};