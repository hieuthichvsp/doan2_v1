const model = require('../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../models');

/**
 * Lấy học kỳ hiện tại
 */
const getCurrentSemester = async () => {
    try {
        const currentSemester = await model.Semester.findOne({
            where: {
                start_time: { [Op.lte]: new Date() },
                end_time: { [Op.gte]: new Date() }
            }
        });
        return currentSemester;
    } catch (error) {
        console.error('Error getting current semester:', error);
        throw new Error('Không thể lấy thông tin học kỳ hiện tại');
    }
};

/**
 * Lấy số liệu thống kê nhanh cho dashboard của giáo viên
 * @param {number} teacherId - ID của giáo viên
 */
const getQuickStats = async (teacherId) => {
    try {
        // Lấy học kỳ hiện tại
        const currentSemester = await getCurrentSemester();
        
        if (!currentSemester) {
            return {
                classesCount: 0,
                sessionsTaught: 0,
                totalSessions: 0,
                attendanceRate: 0
            };
        }
        
        // Lấy số lượng lớp đang dạy
        const classCount = await model.ClassSession.count({
            where: {
                teacher_id: teacherId,
                semester_id: currentSemester.id
            }
        });
        
        // Lấy các buổi học đã diễn ra
        const classSessionIds = await model.ClassSession.findAll({
            attributes: ['id'],
            where: {
                teacher_id: teacherId,
                semester_id: currentSemester.id
            },
            raw: true
        }).then(sessions => sessions.map(session => session.id));
        
        // Tổng số lịch học trong học kỳ
        const totalSchedules = await model.Schedule.count({
            where: {
                id_class_session: { [Op.in]: classSessionIds }
            }
        });
        
        // Số buổi đã điểm danh (có AttendanceSession)
        const taughtSessions = await model.AttendanceSession.count({
            where: {
                class_session_id: { [Op.in]: classSessionIds }
            }
        });
        
        // Tính tỷ lệ điểm danh
        const attendanceQuery = await model.Attendance.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'totalRecords'],
                [sequelize.fn('SUM', 
                    sequelize.literal("CASE WHEN status = 'Đúng giờ' OR status = 'Muộn' THEN 1 ELSE 0 END")), 
                'presentCount']
            ],
            include: [{
                model: model.AttendanceSession,
                as: 'attendanceSession',
                attributes: [],
                where: {
                    class_session_id: { [Op.in]: classSessionIds }
                }
            }],
            raw: true
        });
        
        let attendanceRate = 0;
        if (attendanceQuery && attendanceQuery[0].totalRecords > 0) {
            attendanceRate = Math.round((attendanceQuery[0].presentCount / attendanceQuery[0].totalRecords) * 100);
        }
        
        return {
            classesCount: classCount,
            sessionsTaught: taughtSessions,
            totalSessions: totalSchedules,
            attendanceRate: attendanceRate
        };
    } catch (error) {
        console.error('Error getting quick stats:', error);
        throw new Error('Không thể lấy thống kê nhanh');
    }
};

/**
 * Lấy lịch dạy của giáo viên trong ngày hôm nay
 * @param {number} teacherId - ID của giáo viên
 */
const getTodaySchedules = async (teacherId) => {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Chuyển đổi để CN = 7, T2 = 1, ...
        
        // Lấy lịch dạy của giáo viên trong ngày hôm nay
        const schedules = await model.Schedule.findAll({
            where: {
                weekday: dayOfWeek
            },
            include: [
                {
                    model: model.Time,
                    as: 'time',
                    attributes: ['start_time', 'end_time', 'type']
                },
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    where: {
                        teacher_id: teacherId
                    },
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject',
                            attributes: ['name', 'sub_code']
                        },
                        {
                            model: model.Class,
                            as: 'class',
                            attributes: ['name', 'room_code', 'capacity']
                        }
                    ]
                }
            ],
            order: [
                [{ model: model.Time, as: 'time' }, 'start_time', 'ASC']
            ]
        });
        
        // Lấy thông tin điểm danh cho các lịch học hôm nay
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const attendanceSessions = await model.AttendanceSession.findAll({
            where: {
                date: {
                    [Op.between]: [todayStart, todayEnd]
                },
                schedule_id: {
                    [Op.in]: schedules.map(s => s.id)
                }
            },
            attributes: ['id', 'schedule_id', 'date', 'start_time', 'end_time']
        });
        
        // Map thông tin điểm danh với lịch học tương ứng
        return schedules.map(schedule => {
            const attendanceSession = attendanceSessions.find(session => 
                session.schedule_id === schedule.id
            );
            
            // Xác định trạng thái điểm danh
            let attendanceStatus = 'pending';
            const now = new Date();
            
            if (attendanceSession) {
                const endTime = attendanceSession.end_time;
                if (endTime) {
                    // Kiểm tra thời gian kết thúc
                    const sessionEndTime = new Date(todayStart);
                    const [hours, minutes] = endTime.split(':');
                    sessionEndTime.setHours(parseInt(hours), parseInt(minutes));
                    
                    attendanceStatus = now > sessionEndTime ? 'completed' : 'in-progress';
                } else {
                    attendanceStatus = 'in-progress';
                }
            }
                
            const attendanceSessionId = attendanceSession ? attendanceSession.id : null;
            
            return {
                scheduleId: schedule.id,
                classSessionId: schedule.classSession.id,
                className: `${schedule.classSession.subject.name} - ${schedule.classSession.class_code || ''}`,
                timeStart: schedule.time.start_time,
                timeEnd: schedule.time.end_time,
                classroom: schedule.classSession.class?.name || 'Chưa xác định',
                attendanceStatus,
                attendanceSessionId
            };
        });
    } catch (error) {
        console.error('Error in getTodaySchedules service:', error);
        throw new Error('Không thể lấy lịch dạy hôm nay');
    }
};

/**
 * Lấy danh sách thông báo nhắc nhở cho giáo viên
 * @param {number} teacherId - ID của giáo viên
 */
const getPendingAttendances = async (teacherId) => {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        
        // Lấy lịch học hôm nay của giáo viên
        const todaySchedules = await model.Schedule.findAll({
            where: {
                weekday: dayOfWeek
            },
            include: [
                {
                    model: model.ClassSession,
                    as: 'classSession',
                    where: {
                        teacher_id: teacherId
                    },
                    include: [{
                        model: model.Subject,
                        as: 'subject',
                        attributes: ['name']
                    }]
                },
                {
                    model: model.Time,
                    as: 'time',
                }
            ]
        });
        
        // Lấy thông tin điểm danh của các lịch học hôm nay
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const attendanceSessions = await model.AttendanceSession.findAll({
            where: {
                date: {
                    [Op.between]: [todayStart, todayEnd]
                },
                schedule_id: {
                    [Op.in]: todaySchedules.map(s => s.id)
                }
            },
            attributes: ['id', 'schedule_id', 'date', 'start_time', 'end_time']
        });
        
        // Lấy thông tin điểm danh trong 7 ngày gần đây
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        
        const recentAttendances = await model.AttendanceSession.findAll({
            where: {
                class_session_id: {
                    [Op.in]: todaySchedules.map(s => s.classSession.id)
                },
                date: {
                    [Op.between]: [weekAgo, todayEnd]
                }
            },
            include: [
                {
                    model: model.Schedule,
                    as: 'schedule',
                    include: [
                        {
                            model: model.ClassSession,
                            as: 'classSession',
                            include: [{
                                model: model.Subject,
                                as: 'subject',
                                attributes: ['name']
                            }]
                        },
                        {
                            model: model.Time,
                            as: 'time',
                        }
                    ]
                }
            ]
        });
        
        const notifications = [];
        
        // Thêm thông báo về các buổi học hôm nay chưa điểm danh
        const pendingSchedules = todaySchedules.filter(schedule => {
            const currentTime = today.getHours() * 60 + today.getMinutes();
            const scheduleStartTime = parseInt(schedule.time.start_time.split(':')[0]) * 60 + 
                                    parseInt(schedule.time.start_time.split(':')[1]);
            return !attendanceSessions.some(session => session.schedule_id === schedule.id) && 
                   currentTime >= scheduleStartTime;
        });
        
        if (pendingSchedules.length > 0) {
            notifications.push({
                type: 'attendance',
                message: `Bạn có ${pendingSchedules.length} buổi học chưa điểm danh hôm nay.`,
                timeAgo: 'Hôm nay'
            });
            
            // Thêm chi tiết các buổi chưa điểm danh
            pendingSchedules.forEach(schedule => {
                notifications.push({
                    type: 'attendance',
                    message: `Buổi học ${schedule.classSession.subject.name} (${schedule.time.start_time.substring(0,5)} - ${schedule.time.end_time.substring(0,5)}) chưa được điểm danh.`,
                    timeAgo: 'Hôm nay',
                    scheduleId: schedule.id,
                    classSessionId: schedule.classSession.id
                });
            });
        }
        
        // Thông báo về các phiên điểm danh gần đây chưa hoàn tất
        // Tìm các phiên chưa có end_time
        const incompleteAttendances = recentAttendances.filter(session => !session.end_time);
        
        if (incompleteAttendances.length > 0) {
            incompleteAttendances.forEach(session => {
                const sessionDate = new Date(session.date);
                const diffDays = Math.floor((today - sessionDate) / (24 * 60 * 60 * 1000));
                let timeAgo;
                
                if (diffDays === 0) timeAgo = 'Hôm nay';
                else if (diffDays === 1) timeAgo = 'Hôm qua';
                else timeAgo = `${diffDays} ngày trước`;
                
                notifications.push({
                    type: 'warning',
                    message: `Buổi học ${session.schedule.classSession.subject.name} ngày ${sessionDate.getDate()}/${sessionDate.getMonth() + 1} chưa hoàn thành điểm danh.`,
                    timeAgo,
                    attendanceSessionId: session.id
                });
            });
        }
        
        return notifications;
    } catch (error) {
        console.error('Error getting notifications:', error);
        throw new Error('Không thể lấy thông báo nhắc nhở');
    }
};

/**
 * Lấy danh sách lớp học phần đang giảng dạy
 * @param {number} teacherId - ID của giáo viên
 */
const getTeachingClasses = async (teacherId) => {
    try {
        // Lấy học kỳ hiện tại
        const currentSemester = await getCurrentSemester();
        
        if (!currentSemester) {
            return [];
        }
        
        // Lấy danh sách lớp học phần
        const classSessions = await model.ClassSession.findAll({
            where: {
                teacher_id: teacherId,
                semester_id: currentSemester.id
            },
            include: [
                {
                    model: model.Subject,
                    as: 'subject',
                    attributes: ['name', 'sub_code']
                },
                {
                    model: model.Schedule,
                    as: 'schedules',
                    include: [
                        {
                            model: model.Time,
                            as: 'time',
                            attributes: ['start_time', 'end_time', 'type']
                        }
                    ]
                },
                {
                    model: model.Class,
                    as: 'class',
                    attributes: ['name', 'room_code']
                }
            ]
        });
        
        // Lấy số lượng sinh viên trong mỗi lớp
        const studentCounts = await Promise.all(classSessions.map(async (classSession) => {
            const count = await model.Enrollment.count({
                where: { id_classsession: classSession.id }
            });
            return { id: classSession.id, count };
        }));
        
        // Format dữ liệu trả về
        return classSessions.map(classSession => {
            // Sắp xếp lịch học theo thứ và thời gian
            const schedules = [...classSession.schedules].sort((a, b) => {
                if (a.weekday !== b.weekday) {
                    return a.weekday - b.weekday;
                }
                return a.time.start_time.localeCompare(b.time.start_time);
            });
            
            // Tạo chuỗi lịch học (VD: Thứ 2 (7:00-9:30), Thứ 4 (13:30-16:00))
            const formattedSchedules = schedules.map(schedule => {
                const weekday = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][schedule.weekday % 7];
                return `${weekday} (${schedule.time.start_time.substring(0, 5)}-${schedule.time.end_time.substring(0, 5)})`;
            }).join(', ');
            
            // Lấy số lượng sinh viên
            const studentCount = studentCounts.find(item => item.id === classSession.id)?.count || 0;
            
            return {
                id: classSession.id,
                subjectName: classSession.subject.name,
                classCode: classSession.class_code,
                schedule: formattedSchedules,
                classroom: classSession.class ? classSession.class.name : 'Chưa xác định',
                studentCount
            };
        });
    } catch (error) {
        console.error('Error getting teaching classes:', error);
        throw new Error('Không thể lấy danh sách lớp học phần');
    }
};

/**
 * Lấy danh sách sinh viên có vấn đề về chuyên cần
 * @param {number} teacherId - ID của giáo viên
 */
const getStudentsWithAttendanceIssues = async (teacherId) => {
    try {
        // Lấy học kỳ hiện tại
        const currentSemester = await getCurrentSemester();
        
        if (!currentSemester) {
            return [];
        }
        
        // Lấy danh sách lớp học phần
        const classSessions = await model.ClassSession.findAll({
            attributes: ['id', 'class_code'],
            where: {
                teacher_id: teacherId,
                semester_id: currentSemester.id
            },
            include: [
                {
                    model: model.Subject,
                    as: 'subject',
                    attributes: ['name']
                }
            ]
        });
        
        if (classSessions.length === 0) {
            return [];
        }
        
        const classSessionIds = classSessions.map(session => session.id);
        
        // Lấy danh sách sinh viên và thống kê điểm danh
        const attendanceIssues = [];
        
        for (const classSession of classSessions) {
            // Lấy danh sách sinh viên trong lớp
            const enrollments = await model.Enrollment.findAll({
                where: { id_classsession: classSession.id },
                include: [{
                    model: model.User,
                    as: 'student',
                    attributes: ['id', 'name', 'user_code']
                }]
            });
            
            // Lấy các phiên điểm danh của lớp
            const attendanceSessions = await model.AttendanceSession.findAll({
                where: {
                    class_session_id: classSession.id,
                }
            });
            
            if (attendanceSessions.length === 0) {
                continue; // Bỏ qua lớp chưa có buổi điểm danh nào
            }
            
            const attendanceSessionIds = attendanceSessions.map(session => session.id);
            
            // Với mỗi sinh viên, tính tỷ lệ vắng mặt
            for (const enrollment of enrollments) {
                const attendanceRecords = await model.Attendance.findAll({
                    where: {
                        student_id: enrollment.id_student,
                        attendance_session_id: { [Op.in]: attendanceSessionIds }
                    }
                });
                
                if (attendanceRecords.length === 0) {
                    continue; // Bỏ qua sinh viên chưa có bản ghi điểm danh
                }
                
                const absentCount = attendanceRecords.filter(record => record.status === 'Vắng').length;
                const absentPercentage = Math.round((absentCount / attendanceRecords.length) * 100);
                
                // Chỉ thêm sinh viên có tỷ lệ vắng từ 20% trở lên
                if (absentPercentage >= 20) {
                    attendanceIssues.push({
                        studentId: enrollment.student.id,
                        studentName: enrollment.student.name,
                        studentCode: enrollment.student.user_code,
                        className: `${classSession.subject.name} - ${classSession.class_code}`,
                        classSessionId: classSession.id,
                        absentCount,
                        totalSessions: attendanceRecords.length,
                        absentPercentage
                    });
                }
            }
        }
        
        // Sắp xếp theo tỷ lệ vắng giảm dần
        return attendanceIssues.sort((a, b) => b.absentPercentage - a.absentPercentage);
    } catch (error) {
        console.error('Error getting attendance issues:', error);
        throw new Error('Không thể lấy danh sách sinh viên có vấn đề chuyên cần');
    }
};

/**
 * Lấy lịch dạy sắp tới trong tuần
 * @param {number} teacherId - ID của giáo viên
 */
const getUpcomingSchedules = async (teacherId) => {
    try {
        const today = new Date();
        const currentDay = today.getDay() === 0 ? 7 : today.getDay();
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;
        
        // Lấy lịch dạy của giáo viên
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
                    where: {
                        teacher_id: teacherId
                    },
                    include: [
                        {
                            model: model.Subject,
                            as: 'subject',
                            attributes: ['name', 'sub_code']
                        },
                        {
                            model: model.Class,
                            as: 'class',
                            attributes: ['name', 'room_code']
                        }
                    ]
                }
            ],
            order: [
                ['weekday', 'ASC'],
                [{ model: model.Time, as: 'time' }, 'start_time', 'ASC']
            ]
        });
        
        // Tính ngày trong tuần này cho mỗi lịch học
        const result = [];
        
        // Lấy ngày đầu tuần
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDay + 1);
        
        schedules.forEach(schedule => {
            // Ngày của lịch học trong tuần này
            const scheduleDate = new Date(startOfWeek);
            scheduleDate.setDate(startOfWeek.getDate() + schedule.weekday - 1);
            
            // So sánh với ngày/giờ hiện tại
            const isToday = schedule.weekday === currentDay;
            const isPast = isToday && schedule.time.start_time < currentTimeStr;
            const isCurrentWeek = true; // Mặc định là tuần hiện tại
            
            // Bỏ qua các lịch học đã qua trong hôm nay
            if (isToday && isPast) {
                return;
            }
            
            const weekdayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const weekdayName = weekdayNames[scheduleDate.getDay()];
            const formattedDate = `${weekdayName}, ${scheduleDate.getDate()}/${scheduleDate.getMonth() + 1}`;
            
            result.push({
                date: formattedDate,
                scheduleId: schedule.id,
                classSessionId: schedule.classSession.id,
                className: `${schedule.classSession.subject.name} - ${schedule.classSession.class_code || ''}`,
                timeStart: schedule.time.start_time,
                timeEnd: schedule.time.end_time,
                classroom: schedule.classSession.class ? schedule.classSession.class.name : 'Chưa xác định',
                isToday,
                isCurrentWeek
            });
        });
        
        // Nếu không đủ 5 buổi, thêm buổi học tuần sau
        if (result.length < 5) {
            const nextWeekSchedules = [...schedules].sort((a, b) => {
                if (a.weekday !== b.weekday) {
                    return a.weekday - b.weekday;
                }
                return a.time.start_time.localeCompare(b.time.start_time);
            });
            
            // Lấy ngày đầu tuần sau
            const startOfNextWeek = new Date(startOfWeek);
            startOfNextWeek.setDate(startOfWeek.getDate() + 7);
            
            let count = 0;
            for (const schedule of nextWeekSchedules) {
                if (result.length >= 5) break;
                
                // Ngày của lịch học trong tuần sau
                const scheduleDate = new Date(startOfNextWeek);
                scheduleDate.setDate(startOfNextWeek.getDate() + schedule.weekday - 1);
                
                const weekdayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                const weekdayName = weekdayNames[scheduleDate.getDay()];
                const formattedDate = `${weekdayName}, ${scheduleDate.getDate()}/${scheduleDate.getMonth() + 1}`;
                
                result.push({
                    date: formattedDate,
                    scheduleId: schedule.id,
                    classSessionId: schedule.classSession.id,
                    className: `${schedule.classSession.subject.name} - ${schedule.classSession.class_code || ''}`,
                    timeStart: schedule.time.start_time,
                    timeEnd: schedule.time.end_time,
                    classroom: schedule.classSession.class ? schedule.classSession.class.name : 'Chưa xác định',
                    isNextWeek: true
                });
                
                count++;
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error getting upcoming schedules:', error);
        throw new Error('Không thể lấy lịch dạy sắp tới');
    }
};

module.exports = {
    getQuickStats,
    getTodaySchedules,
    getPendingAttendances,
    getTeachingClasses,
    getStudentsWithAttendanceIssues,
    getUpcomingSchedules,
    getCurrentSemester
};