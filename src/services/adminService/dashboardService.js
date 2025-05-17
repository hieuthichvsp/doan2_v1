const { Op } = require('sequelize');
const { sequelize } = require('../../models');
const model = require('../../models');

/**
 * Lấy số liệu thống kê tổng quan
 */
const getStats = async () => {
    try {
        const studentCount = await model.User.count({
            where: { role_id: 3 } // Giả sử role_id 3 là sinh viên
        });
        
        const teacherCount = await model.User.count({
            where: { role_id: 2 } // Giả sử role_id 2 là giảng viên
        });
        
        const classSessionCount = await model.ClassSession.count();
        
        const deviceCount = await model.Device.count();
        
        return {
            studentCount,
            teacherCount,
            classSessionCount,
            deviceCount
        };
    } catch (error) {
        console.error('Service error - getStats:', error);
        throw error;
    }
};

/**
 * Lấy dữ liệu điểm danh theo thời gian
 */
const getAttendanceData = async (period) => {
    try {
        let startDate;
        const endDate = new Date(); // Thời điểm hiện tại
        
        // Xác định thời điểm bắt đầu dựa trên period
        switch(period) {
            case 'week':
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 30);
                break;
            case 'semester':
                // Lấy học kỳ hiện tại
                const currentSemester = await model.Semester.findOne({
                    where: {
                        start_time: { [Op.lte]: new Date() },
                        end_time: { [Op.gte]: new Date() }
                    }
                });
                
                startDate = currentSemester ? new Date(currentSemester.start_time) : new Date(endDate);
                if (!currentSemester) startDate.setDate(endDate.getDate() - 90); // Mặc định 90 ngày
                break;
            default:
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7);
                break;
        }
        
        // Định dạng dữ liệu theo ngày
        const labels = [];
        const onTime = [];
        const late = [];
        const absent = [];
        
        // Tạo mảng các ngày từ startDate đến endDate
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Format ngày
            const formattedDate = currentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            labels.push(formattedDate);
            
            // Tính toán số liệu cho ngày hiện tại
            const dateStart = new Date(currentDate);
            const dateEnd = new Date(currentDate);
            dateEnd.setDate(dateEnd.getDate() + 1);
            
            // Đếm số điểm danh theo trạng thái
            const [onTimeCount, lateCount, absentCount] = await Promise.all([
                model.Attendance.count({
                    where: {
                        checkin_time: { [Op.between]: [dateStart, dateEnd] },
                        status: 'Đúng giờ'
                    }
                }),
                model.Attendance.count({
                    where: {
                        checkin_time: { [Op.between]: [dateStart, dateEnd] },
                        status: 'Muộn'
                    }
                }),
                model.Attendance.count({
                    where: {
                        checkin_time: { [Op.between]: [dateStart, dateEnd] },
                        status: 'Vắng'
                    }
                })
            ]);
            
            onTime.push(onTimeCount);
            late.push(lateCount);
            absent.push(absentCount);
            
            // Tăng ngày lên 1
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { labels, onTime, late, absent };
    } catch (error) {
        console.error('Service error - getAttendanceData:', error);
        throw error;
    }
};

/**
 * Lấy phân bố học phần theo loại
 */
const getClassTypeDistribution = async () => {
    try {
        const theory = await model.ClassSession.count({
            where: { type: 'LT' }
        });
        
        const practice = await model.ClassSession.count({
            where: { type: 'TH' }
        });
        
        return { theory, practice };
    } catch (error) {
        console.error('Service error - getClassTypeDistribution:', error);
        throw error;
    }
};

/**
 * Lấy danh sách học phần đang diễn ra
 */
const getCurrentSessions = async () => {
    try {
        // Lấy học kỳ hiện tại
        const currentSemester = await model.Semester.findOne({
            where: {
                start_time: { [Op.lte]: new Date() },
                end_time: { [Op.gte]: new Date() }
            }
        });
        
        if (!currentSemester) {
            return [];
        }
        
        // Lấy các học phần trong học kỳ
        const classSessions = await model.ClassSession.findAll({
            where: {
                semester_id: currentSemester.id
            },
            include: [
                {
                    model: model.Subject,
                    as: 'subject',
                    attributes: ['name']
                },
                {
                    model: model.User,
                    as: 'teacher',
                    attributes: ['name']
                }
            ],
            limit: 5,
            order: [['createdAt', 'DESC']]
        });
        
        return classSessions.map(session => {
            const data = session.get({ plain: true });
            return {
                id: data.id,
                class_code: data.class_code,
                name: data.name,
                subject_name: data.subject ? data.subject.name : 'N/A',
                teacher_name: data.teacher ? data.teacher.name : null,
                active: true // Mặc định là active trong học kỳ hiện tại
            };
        });
    } catch (error) {
        console.error('Service error - getCurrentSessions:', error);
        throw error;
    }
};

/**
 * Lấy trạng thái thiết bị
 */
const getDeviceStatus = async () => {
    try {
        const devices = await model.Device.findAll({
            include: [
                {
                    model: model.Class,
                    as: 'class',
                    attributes: ['name']
                }
            ],
            limit: 5,
            order: [['updatedAt', 'DESC']]
        });
        
        return devices.map(device => {
            const data = device.get({ plain: true });
            return {
                id: data.id,
                device_code: data.device_code,
                name: data.name,
                location: data.class ? data.class.name : data.location || 'Không xác định',
                status: data.status
            };
        });
    } catch (error) {
        console.error('Service error - getDeviceStatus:', error);
        throw error;
    }
};

/**
 * Lấy danh sách hoạt động gần đây
 */
const getRecentActivities = async () => {
    try {
        // Giả lập danh sách hoạt động gần đây (nên được lưu vào bảng ActivityLog trong thực tế)
        // Mẫu dữ liệu hoạt động
        const mockActivities = [
            {
                type: 'attendance',
                message: 'Có 25 sinh viên đã điểm danh học phần Java Programming',
                timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 phút trước
            },
            {
                type: 'device',
                message: 'Thiết bị RFID-101 tại P.A2.01 đã kết nối',
                timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 phút trước
            },
            {
                type: 'class',
                message: 'Giảng viên Nguyễn Văn A đã tạo học phần Web Development',
                timestamp: new Date(Date.now() - 1000 * 60 * 120) // 2 giờ trước
            },
            {
                type: 'attendance',
                message: 'Buổi điểm danh Database Systems đã kết thúc với 32/35 sinh viên có mặt',
                timestamp: new Date(Date.now() - 1000 * 60 * 180) // 3 giờ trước
            },
            {
                type: 'device',
                message: 'Thiết bị RFID-205 tại P.B3.02 đã mất kết nối',
                timestamp: new Date(Date.now() - 1000 * 60 * 240) // 4 giờ trước
            }
        ];
        
        return mockActivities;
    } catch (error) {
        console.error('Service error - getRecentActivities:', error);
        throw error;
    }
};

module.exports = {
    getStats,
    getAttendanceData,
    getClassTypeDistribution,
    getCurrentSessions,
    getDeviceStatus,
    getRecentActivities
};