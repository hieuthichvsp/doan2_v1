const model = require('../../models');
const { Op } = require('sequelize');

// Thêm kiểm tra model
if (!model) {
    console.error('Model is undefined');
}

/**
 * Lấy lịch dạy của giáo viên theo ngày
 */
const getSchedulesByDay = async (teacherId, date) => {
    try {
        // Chuyển đổi date thành weekday (0-6, 0 là Chủ nhật)
        const dateObj = new Date(date);
        let weekday = dateObj.getDay();

        // Chuyển đổi weekday sang định dạng sử dụng trong DB (1-7, với 7 là Chủ nhật)
        weekday = weekday === 0 ? 7 : weekday;

        // Lấy lịch học theo weekday
        const schedules = await model.Schedule.findAll({
            include: [
                {
                    model: model.Time,
                    as: 'time',
                    attributes: ['start_time', 'end_time', 'type']
                },
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    attributes: ['id', 'name', 'class_code', 'type'],
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject',
                            attributes: ['id', 'name', 'sub_code']
                        },
                        {
                            model: model.Class,
                            as: 'class',
                            attributes: ['id', 'room_code', 'name']
                        }
                    ],
                    where: { teacher_id: teacherId }
                }
            ],
            where: { weekday: weekday },
            order: [
                [{ model: model.Time, as: 'time' }, 'start_time', 'ASC']
            ]
        });

        // Format dữ liệu trả về
        const formattedSchedules = schedules.map(schedule => {
            const plainSchedule = schedule.get({ plain: true });

            return {
                id: plainSchedule.id,
                weekday: plainSchedule.weekday,
                date: date,
                startTime: plainSchedule.time.start_time.substring(0, 5),
                endTime: plainSchedule.time.end_time.substring(0, 5),
                classSession: plainSchedule.classSession,
                subject: plainSchedule.classSession.subject,
                class: plainSchedule.classSession.class
            };
        });

        return {
            success: true,
            schedules: formattedSchedules
        };
    } catch (error) {
        console.error('Error in getSchedulesByDay:', error);
        return {
            success: false,
            message: 'Không thể lấy lịch dạy theo ngày: ' + error.message
        };
    }
};

/**
 * Lấy lịch dạy của giáo viên theo khoảng thời gian
 */
const getSchedulesByRange = async (teacherId, startDate, endDate, view) => {
    try {
        if (!teacherId) {
            return {
                success: false,
                message: 'Thiếu thông tin giáo viên'
            };
        }

        if (!startDate || !endDate) {
            return {
                success: false,
                message: 'Thiếu thông tin ngày tháng'
            };
        }

        // Tìm học kỳ đang diễn ra
        let activeSemesters = [];
        try {
            // Kiểm tra model.Semester trước khi truy vấn
            if (model.Semester) {
                activeSemesters = await model.Semester.findAll({
                    where: {
                        // Học kỳ bắt đầu trước ngày kết thúc và kết thúc sau ngày bắt đầu
                        [Op.and]: [
                            {
                                start_time: {
                                    [Op.lte]: endDate
                                }
                            },
                            {
                                end_time: {
                                    [Op.gte]: startDate
                                }
                            }
                        ]
                    },
                    order: [['start_time', 'ASC']]
                });
            }
        } catch (error) {
            console.error('Error querying semesters:', error);
            // Tiếp tục với activeSemesters là mảng rỗng
        }

        // THAY ĐỔI QUAN TRỌNG: Nếu không có học kỳ nào trong khoảng thời gian, trả về mảng rỗng
        if (activeSemesters.length === 0) {
            return {
                success: true,
                schedules: [],
                activeSemesters: [],
                noSemesterFound: true,
                message: 'Không có học kỳ nào diễn ra trong khoảng thời gian này'
            };
        }

        // Tạo danh sách học kỳ để hiển thị thông tin
        const semesterInfo = activeSemesters.map(sem => ({
            id: sem.id,
            name: sem.name,
            startDate: sem.start_time,
            endDate: sem.end_time
        }));

        // Giới hạn dateRange chỉ bao gồm các ngày trong học kỳ
        // Tìm ngày bắt đầu sớm nhất và ngày kết thúc muộn nhất của các học kỳ
        let earliestStart = new Date(activeSemesters[0].start_time);
        let latestEnd = new Date(activeSemesters[0].end_time);

        activeSemesters.forEach(sem => {
            const semStart = new Date(sem.start_time);
            const semEnd = new Date(sem.end_time);

            if (semStart < earliestStart) earliestStart = semStart;
            if (semEnd > latestEnd) latestEnd = semEnd;
        });

        // Giới hạn startDate và endDate trong phạm vi của học kỳ
        const effectiveStartDate = new Date(Math.max(new Date(startDate), earliestStart));
        const effectiveEndDate = new Date(Math.min(new Date(endDate), latestEnd));

        // Xác định các ngày trong khoảng thời gian (chỉ trong học kỳ)
        const dateRange = getDatesInRange(effectiveStartDate, effectiveEndDate);
        const weekdayList = dateRange.map(date => {
            let weekday = date.getDay();
            return weekday === 0 ? 7 : weekday;
        });

        // Lấy lịch học theo danh sách weekday
        let schedules = [];
        try {
            schedules = await model.Schedule.findAll({
                include: [
                    {
                        model: model.Time,
                        as: 'time',
                        attributes: ['start_time', 'end_time', 'type']
                    },
                    {
                        model: model.ClassSession,
                        as: 'classSession',
                        attributes: ['id', 'name', 'class_code', 'type', 'sub_id'],
                        include: [
                            {
                                model: model.Subject,
                                as: 'subject',
                                attributes: ['id', 'name', 'sub_code']
                            },
                            {
                                model: model.Class,
                                as: 'class',
                                attributes: ['id', 'room_code', 'name']
                            }
                        ],
                        where: { teacher_id: teacherId }
                    }
                ],
                where: {
                    weekday: {
                        [Op.in]: weekdayList
                    }
                },
                order: [
                    ['weekday', 'ASC'],
                    [{ model: model.Time, as: 'time' }, 'start_time', 'ASC']
                ]
            });
        } catch (error) {
            console.error('Error querying schedules:', error);
            return {
                success: false,
                message: 'Không thể lấy lịch dạy: ' + error.message
            };
        }

        // Tạo lịch học cho từng ngày trong khoảng thời gian
        const formattedSchedules = [];

        dateRange.forEach(date => {
            const weekday = date.getDay() === 0 ? 7 : date.getDay();
            const dateStr = formatDate(date);

            // Lọc lịch học theo weekday
            const matchingSchedules = schedules.filter(schedule => schedule.weekday === weekday);

            // Tạo lịch học cho từng ngày
            matchingSchedules.forEach(schedule => {
                const plainSchedule = schedule.get({ plain: true });

                // Kiểm tra xem ngày này có trong học kỳ không
                const isInSemester = activeSemesters.some(sem => {
                    const semStartDate = new Date(sem.start_time);
                    const semEndDate = new Date(sem.end_time);
                    return date >= semStartDate && date <= semEndDate;
                });

                // Chỉ thêm lịch học nếu ngày nằm trong học kỳ
                if (isInSemester) {
                    formattedSchedules.push({
                        id: plainSchedule.id,
                        weekday: plainSchedule.weekday,
                        date: dateStr,
                        startTime: plainSchedule.time.start_time.substring(0, 5),
                        endTime: plainSchedule.time.end_time.substring(0, 5),
                        classSession: plainSchedule.classSession,
                        subject: plainSchedule.classSession.subject,
                        class: plainSchedule.classSession.class
                    });
                }
            });
        });

        // Sắp xếp lịch học theo ngày và thời gian
        formattedSchedules.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        return {
            success: true,
            schedules: formattedSchedules,
            activeSemesters: semesterInfo,
            semesterFiltered: true // Cho frontend biết kết quả đã được lọc theo học kỳ
        };
    } catch (error) {
        console.error('Error in getSchedulesByRange:', error);
        return {
            success: false,
            message: 'Không thể lấy lịch dạy: ' + error.message
        };
    }
};

/**
 * Lấy danh sách môn học của giáo viên
 */
const getTeacherSubjects = async (teacherId) => {
    try {
        // Lấy tất cả lớp học phần của giáo viên
        const classSessions = await model.ClassSession.findAll({
            where: { teacher_id: teacherId },
            include: [{
                model: model.Subject,
                as: 'subject',
                attributes: ['id', 'name', 'sub_code']
            }],
            attributes: ['sub_id']
        });

        // Lọc ra các môn học duy nhất
        const uniqueSubjects = [];
        const subjectIds = new Set();

        classSessions.forEach(cs => {
            if (cs.subject && !subjectIds.has(cs.subject.id)) {
                subjectIds.add(cs.subject.id);
                uniqueSubjects.push(cs.subject);
            }
        });

        return {
            success: true,
            data: uniqueSubjects
        };
    } catch (error) {
        console.error('Error in getTeacherSubjects:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách môn học: ' + error.message
        };
    }
};

/**
 * Lấy danh sách lớp học phần của giáo viên
 */
const getTeacherClassSessions = async (teacherId) => {
    try {
        // Lấy tất cả lớp học phần của giáo viên
        const classSessions = await model.ClassSession.findAll({
            where: { teacher_id: teacherId },
            include: [{
                model: model.Subject,
                as: 'subject',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'name', 'class_code', 'type']
        });

        // Format dữ liệu trả về
        const formattedClassSessions = classSessions.map(cs => {
            const plainSession = cs.get({ plain: true });
            return {
                id: plainSession.id,
                name: plainSession.name,
                class_code: plainSession.class_code,
                type: plainSession.type,
                subject_name: plainSession.subject ? plainSession.subject.name : 'N/A'
            };
        });

        return {
            success: true,
            data: formattedClassSessions
        };
    } catch (error) {
        console.error('Error in getTeacherClassSessions:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách lớp học phần: ' + error.message
        };
    }
};

/**
 * Lấy danh sách phòng học của giáo viên
 */
const getTeacherRooms = async (teacherId) => {
    try {
        // Lấy tất cả phòng học của lớp học phần giáo viên dạy
        const classRooms = await model.ClassSession.findAll({
            where: { teacher_id: teacherId },
            include: [{
                model: model.Class,
                as: 'class',
                attributes: ['id', 'room_code', 'name']
            }],
            attributes: []
        });

        // Lọc ra các phòng học duy nhất
        const uniqueRooms = [];
        const roomIds = new Set();

        classRooms.forEach(cr => {
            if (cr.class && !roomIds.has(cr.class.id)) {
                roomIds.add(cr.class.id);
                uniqueRooms.push(cr.class);
            }
        });

        return {
            success: true,
            data: uniqueRooms
        };
    } catch (error) {
        console.error('Error in getTeacherRooms:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách phòng học: ' + error.message
        };
    }
};

// Hàm tiện ích
function getDatesInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArray = [];

    let currentDate = new Date(start);

    while (currentDate <= end) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

module.exports = {
    getSchedulesByDay,
    getSchedulesByRange,
    getTeacherSubjects,
    getTeacherClassSessions,
    getTeacherRooms
};