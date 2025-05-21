const model = require('../../models');
const { Op } = require('sequelize');

// Thêm kiểm tra model
if (!model) {
    console.error('Model is undefined');
}

/**
 * Lấy lịch dạy của giáo viên theo ngày
 */
const getSchedulesByDay = async (teacherId, date, semesterId) => {
    try {
        // Thêm log để debug
        console.log(`Getting schedules for teacher ${teacherId} on ${date} in semester ${semesterId}`);

        // Kiểm tra semesterId có tồn tại
        if (!semesterId) {
            return {
                success: false,
                message: 'Vui lòng chọn học kỳ'
            };
        }

        // Lấy thông tin học kỳ
        const semester = await model.Semester.findByPk(semesterId);
        if (!semester) {
            return {
                success: false,
                message: 'Học kỳ không tồn tại'
            };
        }

        // Format thông tin học kỳ
        const semesterInfo = {
            id: semester.id,
            name: semester.name,
            startDate: semester.start_time,
            endDate: semester.end_time
        };

        // Kiểm tra xem ngày có nằm trong học kỳ không
        const dateObj = new Date(date);
        const semesterStart = new Date(semester.start_time);
        const semesterEnd = new Date(semester.end_time);

        if (dateObj < semesterStart || dateObj > semesterEnd) {
            console.log(`Date ${date} is outside semester range ${semester.start_time} - ${semester.end_time}`);
            return {
                success: true,
                schedules: [],
                message: 'Ngày đã chọn không nằm trong học kỳ',
                activeSemesters: [semesterInfo]
            };
        }

        // Chuyển đổi date thành weekday (0-6, 0 là Chủ nhật)
        let weekday = dateObj.getDay();

        // Chuyển đổi weekday sang định dạng sử dụng trong DB (1-7, với 7 là Chủ nhật)
        weekday = weekday === 0 ? 7 : weekday;

        console.log(`Looking for schedules on weekday ${weekday}`);

        // Lấy lịch học theo weekday và giới hạn trong học kỳ đã chọn
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
                    where: {
                        teacher_id: teacherId,
                        semester_id: semesterId   // Lọc theo học kỳ đã chọn
                    },
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
                    ]
                }
            ],
            where: { weekday: weekday },
            order: [
                [{ model: model.Time, as: 'time' }, 'start_time', 'ASC']
            ]
        });

        console.log(`Found ${schedules.length} schedules`);

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

        // Thêm message khi không có lịch học
        return {
            success: true,
            schedules: formattedSchedules,
            activeSemesters: [semesterInfo],
            message: formattedSchedules.length === 0 ? 'Không có lịch dạy trong ngày này' : null
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
const getSchedulesByRange = async (teacherId, startDate, endDate, semesterId) => {
    try {
        if (!teacherId || !semesterId) {
            return {
                success: false,
                message: 'Thiếu thông tin giáo viên hoặc học kỳ'
            };
        }

        if (!startDate || !endDate) {
            return {
                success: false,
                message: 'Thiếu thông tin ngày tháng'
            };
        }

        // Lấy thông tin học kỳ đã chọn
        const semester = await model.Semester.findByPk(semesterId);
        if (!semester) {
            return {
                success: false,
                message: 'Học kỳ không tồn tại'
            };
        }

        const semesterInfo = {
            id: semester.id,
            name: semester.name,
            startDate: semester.start_time,
            endDate: semester.end_time
        };

        // Giới hạn khoảng thời gian trong phạm vi của học kỳ
        const semesterStart = new Date(semester.start_time);
        const semesterEnd = new Date(semester.end_time);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);

        // Nếu khoảng thời gian hoàn toàn nằm ngoài học kỳ
        if (rangeEnd < semesterStart || rangeStart > semesterEnd) {
            return {
                success: true,
                schedules: [],
                activeSemesters: [semesterInfo],
                message: 'Khoảng thời gian đã chọn không nằm trong học kỳ'
            };
        }

        // Giới hạn dateRange chỉ trong học kỳ
        const effectiveStart = new Date(Math.max(rangeStart.getTime(), semesterStart.getTime()));
        const effectiveEnd = new Date(Math.min(rangeEnd.getTime(), semesterEnd.getTime()));

        // Xác định các ngày trong khoảng thời gian (chỉ trong học kỳ)
        const dateRange = getDatesInRange(effectiveStart, effectiveEnd);
        const weekdayList = dateRange.map(date => {
            let weekday = date.getDay();
            return weekday === 0 ? 7 : weekday;
        });

        // Lấy lịch học theo danh sách weekday và giới hạn trong học kỳ đã chọn
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
                    attributes: ['id', 'name', 'class_code', 'type', 'sub_id'],
                    where: {
                        teacher_id: teacherId,
                        semester_id: semesterId   // Lọc theo học kỳ đã chọn
                    },
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
                    ]
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
            });
        });

        // Sắp xếp lịch học theo ngày và thời gian
        formattedSchedules.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        // Format dữ liệu trả về với message thông báo không có lịch
        return {
            success: true,
            schedules: formattedSchedules,
            activeSemesters: [semesterInfo],
            message: formattedSchedules.length === 0 ? 'Không có lịch dạy trong khoảng thời gian này' : null
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

/**
 * Lấy danh sách học kỳ
 */
const getSemesters = async () => {
    try {
        const semesters = await model.Semester.findAll({
            order: [['end_time', 'DESC']]
        });

        return {
            success: true,
            semesters
        };
    } catch (error) {
        console.error('Error getting semesters:', error);
        return {
            success: false,
            message: 'Không thể lấy danh sách học kỳ: ' + error.message
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
    getTeacherRooms,
    getSemesters  // Thêm hàm này
};