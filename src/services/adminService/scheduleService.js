const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Lấy danh sách tất cả lịch học
 */
const getAllSchedules = async () => {
    try {
        const schedules = await model.Schedule.findAll({
            include: [
                {
                    model: model.Time,
                    as: 'time'
                },
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject'
                        },
                        {
                            model: model.User,
                            as: 'teacher'
                        },
                        {
                            model: model.Class,
                            as: 'class'
                        }
                    ]
                }
            ],
            order: [['id', 'ASC']]
        });
        
        return {
            success: true,
            data: schedules
        };
    } catch (error) {
        console.error('Error in getAllSchedules service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách lịch học'
        };
    }
};

/**
 * Lấy danh sách lịch học có phân trang và tìm kiếm
 */
const getAllSchedulesWithPagination = async (search, page = 1, limit = 6) => {
    try {
        const offset = (page - 1) * limit;
        const { Sequelize } = require('sequelize');
        
        // Nếu có tìm kiếm, trước tiên lọc ra các lớp học phần phù hợp
        let classSessionIds = [];
        if (search) {
            const matchingClassSessions = await model.ClassSession.findAll({
                include: [
                    {
                        model: model.Subject,
                        as: 'subject'
                    },
                    {
                        model: model.User,
                        as: 'teacher'
                    },
                    {
                        model: model.Class,
                        as: 'class'
                    }
                ],
                where: Sequelize.literal(`
                    class_code LIKE '%${search}%' 
                    OR subject.name LIKE '%${search}%'
                    OR teacher.name LIKE '%${search}%' 
                    OR class.name LIKE '%${search}%'
                `)
            });
            
            classSessionIds = matchingClassSessions.map(cs => cs.id);
            
            // Nếu không tìm thấy lớp học phần nào, trả về kết quả rỗng
            if (classSessionIds.length === 0) {
                return {
                    success: true,
                    data: [],
                    total: 0,
                    currentPage: parseInt(page),
                    totalPages: 0
                };
            }
        }
        
        // Xây dựng query chính
        let queryOptions = {
            include: [
                {
                    model: model.Time,
                    as: 'time'
                },
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject'
                        },
                        {
                            model: model.User,
                            as: 'teacher'
                        },
                        {
                            model: model.Class,
                            as: 'class'
                        }
                    ]
                }
            ],
            order: [['weekday', 'ASC'], ['id_time', 'ASC']],
            offset,
            limit,
            distinct: true
        };
        
        // Thêm điều kiện where nếu có tìm kiếm
        if (search && classSessionIds.length > 0) {
            queryOptions.where = {
                id_class_session: {
                    [Op.in]: classSessionIds
                }
            };
        }
        
        const { count, rows } = await model.Schedule.findAndCountAll(queryOptions);
        
        return {
            success: true,
            data: rows,
            total: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        };
    } catch (error) {
        console.error('Error in getAllSchedulesWithPagination service:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách lịch học'
        };
    }
};

/**
 * Lấy thông tin lịch học theo ID
 */
const getScheduleById = async (id) => {
    try {
        const schedule = await model.Schedule.findByPk(id, {
            include: [
                {
                    model: model.Time,
                    as: 'time'
                },
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject'
                        },
                        {
                            model: model.User,
                            as: 'teacher'
                        },
                        {
                            model: model.Class,
                            as: 'class'
                        },
                        {
                            model: model.Semester,
                            as: 'semester'
                        }
                    ]
                }
            ]
        });
        
        if (!schedule) {
            return {
                success: false,
                message: 'Không tìm thấy lịch học'
            };
        }
        
        return {
            success: true,
            data: schedule
        };
    } catch (error) {
        console.error('Error in getScheduleById service:', error);
        return {
            success: false,
            message: 'Không thể lấy thông tin lịch học'
        };
    }
};

/**
 * Kiểm tra xung đột lịch học
 */
const checkScheduleConflict = async (weekday, timeId, classSessionId, excludeId = null) => {
    try {
        // Kiểm tra xung đột với các lịch học khác của cùng lớp học phần
        const classSession = await model.ClassSession.findByPk(classSessionId);
        if (!classSession) {
            return {
                success: false,
                message: 'Không tìm thấy lớp học phần'
            };
        }

        // Tìm các lịch học đã tồn tại của lớp học phần này
        const existingSchedules = await model.Schedule.findAll({
            where: {
                id_class_session: classSessionId,
                ...(excludeId && { id: { [Op.ne]: excludeId } })
            }
        });
        
        // Kiểm tra xung đột về thời gian với các lịch học hiện có của lớp học phần này
        const conflictInSameClass = existingSchedules.some(schedule => 
            schedule.weekday === weekday && schedule.id_time === timeId
        );
        
        if (conflictInSameClass) {
            return {
                success: false,
                isConflict: true,
                message: 'Lớp học phần này đã có lịch học vào cùng thời gian'
            };
        }

        // Kiểm tra xung đột với giáo viên
        const teacherConflict = await checkTeacherConflict(weekday, timeId, classSession.teacher_id, excludeId);
        if (teacherConflict.isConflict) {
            return teacherConflict;
        }

        // Kiểm tra xung đột với phòng học
        const roomConflict = await checkRoomConflict(weekday, timeId, classSession.class_id, excludeId);
        if (roomConflict.isConflict) {
            return roomConflict;
        }
        
        return {
            success: true,
            isConflict: false
        };
    } catch (error) {
        console.error('Error in checkScheduleConflict service:', error);
        return {
            success: false,
            message: 'Không thể kiểm tra xung đột lịch học'
        };
    }
};

/**
 * Tạo một lịch học mới
 */
const createSchedule = async (scheduleData) => {
    try {
        const schedule = await model.Schedule.create(scheduleData);
        return schedule;
    } catch (error) {
        console.error('Error in createSchedule service:', error);
        throw error;
    }
};

/**
 * Kiểm tra xung đột với phòng học
 */
const checkRoomConflict = async (weekday, timeId, classId, excludeId = null) => {
    try {
        // Nếu không có phòng học, không cần kiểm tra
        if (!classId) {
            return {
                success: true,
                isConflict: false
            };
        }

        // Xây dựng điều kiện where
        const whereCondition = {
            weekday: weekday,
            id_time: timeId
        };
        
        // Nếu có excludeId, loại trừ lịch học này khỏi kiểm tra
        if (excludeId) {
            whereCondition.id = { [Op.ne]: excludeId };
        }
        
        // Tìm các lịch học cùng phòng, cùng thứ, cùng khung giờ
        const conflictingSchedules = await model.Schedule.findAll({
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    where: {
                        class_id: classId
                    }
                }
            ],
            where: whereCondition
        });

        if (conflictingSchedules.length > 0) {
            return {
                success: false,
                isConflict: true,
                message: 'Phòng học đã được sử dụng trong khung giờ này'
            };
        }

        return {
            success: true,
            isConflict: false
        };
    } catch (error) {
        console.error('Error in checkRoomConflict service:', error);
        throw error;
    }
};

/**
 * Kiểm tra xung đột với giáo viên
 */
const checkTeacherConflict = async (weekday, timeId, teacherId, excludeId = null) => {
    try {
        // Nếu không có giáo viên, không cần kiểm tra
        if (!teacherId) {
            return {
                success: true,
                isConflict: false
            };
        }

        // Xây dựng điều kiện where
        const whereCondition = {
            weekday: weekday,
            id_time: timeId
        };
        
        // Nếu có excludeId, loại trừ lịch học này khỏi kiểm tra
        if (excludeId) {
            whereCondition.id = { [Op.ne]: excludeId };
        }
        
        // Tìm các lịch học cùng giảng viên, cùng thứ, cùng khung giờ
        const conflictingSchedules = await model.Schedule.findAll({
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    where: {
                        teacher_id: teacherId
                    }
                }
            ],
            where: whereCondition
        });

        if (conflictingSchedules.length > 0) {
            return {
                success: false,
                isConflict: true,
                message: 'Giảng viên đã có lịch dạy trong khung giờ này'
            };
        }

        return {
            success: true,
            isConflict: false
        };
    } catch (error) {
        console.error('Error in checkTeacherConflict service:', error);
        throw error;
    }
};

/**
 * Cập nhật thông tin lịch học
 */
const updateSchedule = async (id, scheduleData) => {
    try {
        // Kiểm tra lịch học tồn tại
        const schedule = await model.Schedule.findByPk(id);
        
        if (!schedule) {
            return {
                success: false,
                message: 'Không tìm thấy lịch học'
            };
        }
        
        // Cập nhật lịch học
        await schedule.update(scheduleData);
        
        // Lấy lịch học đã cập nhật với đầy đủ thông tin
        const updatedSchedule = await model.Schedule.findByPk(id, {
            include: [
                {
                    model: model.Time,
                    as: 'time'
                },
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject'
                        },
                        {
                            model: model.User,
                            as: 'teacher'
                        },
                        {
                            model: model.Class,
                            as: 'class'
                        }
                    ]
                }
            ]
        });
        
        return {
            success: true,
            message: 'Cập nhật lịch học thành công',
            data: updatedSchedule
        };
    } catch (error) {
        console.error('Error in updateSchedule service:', error);
        return {
            success: false,
            message: 'Không thể cập nhật lịch học'
        };
    }
};

/**
 * Lấy danh sách lịch học theo tiết học
 * @param {number} timeId - ID của tiết học
 */
const getSchedulesByTimeId = async (timeId) => {
    try {
        const schedules = await model.Schedule.findAll({
            where: { id_time: timeId },
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',  // Đổi từ 'ClassSession' thành 'classSession'
                    attributes: ['id', 'class_code', 'name'],
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject',  // Đổi từ 'Subject' thành 'subject'
                            attributes: ['name']
                        },
                        {
                            model: model.Class,
                            as: 'class',  // Đổi từ 'Class' thành 'class'
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: model.Time,
                    as: 'time',  // Đổi từ 'Time' thành 'time'
                    attributes: ['start_time', 'end_time', 'type']
                }
            ],
            order: [
                ['weekday', 'ASC']
            ]
        });

        // Format the schedules
        return schedules.map(schedule => {
            const scheduleData = schedule.get({ plain: true });
            
            // Format weekday
            const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
            const weekdayFormatted = weekdays[scheduleData.weekday];
            
            return {
                id: scheduleData.id,
                weekday: scheduleData.weekday,
                weekday_formatted: weekdayFormatted,
                time_id: scheduleData.id_time,
                time_start: scheduleData.time?.start_time,
                time_end: scheduleData.time?.end_time,
                time_type: scheduleData.time?.type,
                class_session_id: scheduleData.id_class_session,
                class_code: scheduleData.classSession?.class_code,
                class_name: scheduleData.classSession?.name,
                subject_name: scheduleData.classSession?.subject?.name,
                classroom_name: scheduleData.classSession?.class?.name
            };
        });
    } catch (error) {
        console.error(`Service error - getSchedulesByTimeId:`, error);
        throw error;
    }
};

// Cập nhật module.exports
module.exports = {
    getAllSchedules,
    getAllSchedulesWithPagination,
    getScheduleById,
    checkScheduleConflict,
    createSchedule,
    checkRoomConflict,
    checkTeacherConflict,
    updateSchedule,
    getSchedulesByTimeId
};