const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý thời gian tiết học
 */
const showTimeManagement = async (req, res) => {
    try {
        let times = [];
        let searchTerm = req.query.search || '';
        let searchResults = false;

        // Phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Số lượng tiết học trên mỗi trang
        const offset = (page - 1) * limit;
        let totalTimes = 0;
        let totalPages = 0;

        if (searchTerm) {
            // Tìm kiếm với phân trang
            const result = await adminService.timeService.searchTimesWithPagination(searchTerm, limit, offset);
            times = result.times;
            totalTimes = result.count;
            searchResults = true;
        } else {
            // Lấy tất cả tiết học với phân trang
            const result = await adminService.timeService.getAllTimesWithPagination(limit, offset);
            times = result.times;
            totalTimes = result.count;
        }

        // Tính số trang
        totalPages = Math.ceil(totalTimes / limit);
        
        res.render('adminView/timeManagement', {
            title: 'Quản lý thời gian tiết học',
            times,
            user: req.session.user,
            searchTerm,
            searchResults,
            pagination: {
                page,
                limit,
                totalTimes,
                totalPages
            }
        });
    } catch (error) {
        console.error('Controller error - showTimeManagement:', error);
        res.status(500).render('error/500', {
            title: 'Lỗi Server',
            message: 'Không thể tải trang quản lý thời gian tiết học',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * API lấy tất cả thời gian tiết học
 */
const getAllTimes = async (req, res) => {
    try {
        const times = await adminService.timeService.getAllTimes();
        res.json({ success: true, times });
    } catch (error) {
        console.error('Controller error - getAllTimes:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách thời gian tiết học'
        });
    }
};

/**
 * API lấy thông tin tiết học theo ID
 */
const getTimeById = async (req, res) => {
    try {
        const id = req.params.id;
        const time = await adminService.timeService.getTimeById(id);

        if (!time) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin tiết học'
            });
        }

        // Đếm số lịch học đang sử dụng
        const scheduleCount = await adminService.timeService.countSchedulesByTime(id);
        console.log('schedule_time:',scheduleCount);

        res.json({
            success: true,
            time: { ...time, scheduleCount }
        });
    } catch (error) {
        console.error('Controller error - getTimeById:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải thông tin tiết học'
        });
    }
};

/**
 * API tạo thời gian tiết học mới
 */
const createTime = async (req, res) => {
    try {
        const { start_time, end_time, type } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!start_time || !end_time || !type) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin tiết học'
            });
        }

        // Chuẩn hóa định dạng thời gian
        const normalizedStartTime = formatTimeForDB(start_time);
        const normalizedEndTime = formatTimeForDB(end_time);

        // Kiểm tra định dạng thời gian
        if (!normalizedStartTime || !normalizedEndTime) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng HH:MM'
            });
        }

        // Kiểm tra loại tiết học
        if (type !== 'LT' && type !== 'TH') {
            return res.status(400).json({
                success: false,
                message: 'Loại tiết học không hợp lệ. Chỉ chấp nhận LT hoặc TH'
            });
        }

        // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
        if (!validateTimeRange(normalizedStartTime, normalizedEndTime)) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
            });
        }

        // Tạo tiết học mới với thời gian đã chuẩn hóa
        const newTime = await adminService.timeService.createTime({
            start_time: normalizedStartTime,
            end_time: normalizedEndTime,
            type
        });

        res.status(201).json({ success: true, time: newTime });
    } catch (error) {
        console.error('Controller error - createTime:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo thời gian tiết học mới'
        });
    }
};

/**
 * Format thời gian thành chuỗi hợp lệ cho DB (HH:MM:SS)
 */
const formatTimeForDB = (timeInput) => {
    try {
        if (!timeInput) return null;
        
        // Nếu đã là chuỗi thời gian hợp lệ HH:MM
        const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        const match = String(timeInput).trim().match(timePattern);
        
        if (match) {
            // Đảm bảo định dạng có 2 chữ số cho giờ
            const hour = match[1].padStart(2, '0');
            return `${hour}:${match[2]}:00`;
        }
        
        // Nếu đã có định dạng HH:MM:SS
        const fullPattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
        const fullMatch = String(timeInput).trim().match(fullPattern);
        
        if (fullMatch) {
            // Đảm bảo định dạng có 2 chữ số cho giờ
            const hour = fullMatch[1].padStart(2, '0');
            return `${hour}:${fullMatch[2]}:${fullMatch[3]}`;
        }
        
        return null;
    } catch (error) {
        console.error('Error formatting time:', error);
        return null;
    }
};

/**
 * API cập nhật thông tin thời gian tiết học
 */
const updateTime = async (req, res) => {
    try {
        const id = req.params.id;
        const { start_time, end_time, type } = req.body;

        // Kiểm tra thời gian tiết học tồn tại
        const existingTime = await adminService.timeService.getTimeById(id);
        if (!existingTime) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thời gian tiết học'
            });
        }

        // Kiểm tra dữ liệu đầu vào
        if (!start_time || !end_time || !type) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin tiết học'
            });
        }

        // Chuẩn hóa định dạng thời gian
        const normalizedStartTime = formatTimeForDB(start_time);
        const normalizedEndTime = formatTimeForDB(end_time);

        // Kiểm tra định dạng thời gian
        if (!normalizedStartTime || !normalizedEndTime) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng HH:MM'
            });
        }

        // Kiểm tra loại tiết học
        if (type !== 'LT' && type !== 'TH') {
            return res.status(400).json({
                success: false,
                message: 'Loại tiết học không hợp lệ. Chỉ chấp nhận LT hoặc TH'
            });
        }

        // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
        if (!validateTimeRange(normalizedStartTime, normalizedEndTime)) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
            });
        }

        // Kiểm tra trùng lặp thời gian
        const overlappingTime = await adminService.timeService.checkOverlappingTime(
            start_time, end_time, type, id
        );

        if (overlappingTime) {
            const formattedTime = `${overlappingTime.start_time_formatted} - ${overlappingTime.end_time_formatted}`;
            return res.status(400).json({
                success: false,
                message: `Đã có tiết học loại ${type} vào khung giờ ${formattedTime}`
            });
        }

        // Cập nhật tiết học với thời gian đã chuẩn hóa
        const updatedTime = await adminService.timeService.updateTime(id, {
            start_time: normalizedStartTime,
            end_time: normalizedEndTime,
            type
        });

        res.json({ success: true, time: updatedTime });
    } catch (error) {
        console.error('Controller error - updateTime:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật thông tin tiết học'
        });
    }
};

/**
 * API xóa thời gian tiết học
 */
const deleteTime = async (req, res) => {
    try {
        const id = req.params.id;

        // Kiểm tra thời gian tiết học tồn tại
        const existingTime = await adminService.timeService.getTimeById(id);
        if (!existingTime) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thời gian tiết học'
            });
        }

        // Kiểm tra tiết học có đang được sử dụng không
        const isInUse = await adminService.timeService.checkTimeInUse(id);
        if (isInUse) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tiết học này vì đang được sử dụng trong lịch học'
            });
        }

        // Xóa tiết học
        await adminService.timeService.deleteTime(id);

        res.json({
            success: true,
            message: 'Xóa thời gian tiết học thành công'
        });
    } catch (error) {
        console.error('Controller error - deleteTime:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa thời gian tiết học'
        });
    }
};

/**
 * API lấy danh sách lịch học theo tiết học
 */
const getSchedulesByTimeId = async (req, res) => {
    try {
        const timeId = req.params.id;
        
        // Kiểm tra xem tiết học có tồn tại không
        const time = await adminService.timeService.getTimeById(timeId);
        if (!time) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết học'
            });
        }
        
        // Lấy danh sách lịch học
        const schedules = await adminService.scheduleService.getSchedulesByTimeId(timeId);
        
        res.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Controller error - getSchedulesByTimeId:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách lịch học'
        });
    }
};

/**
 * Hàm kiểm tra định dạng thời gian HH:MM hoặc HH:MM:SS
 * @param {string} time Chuỗi thời gian cần kiểm tra
 */
const validateTimeFormat = (time) => {
    if (!time) return false;
    
    // Hỗ trợ cả hai định dạng HH:MM và HH:MM:SS
    const pattern1 = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const pattern2 = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    
    // Chuyển đối tượng Date thành chuỗi thời gian nếu cần
    if (time instanceof Date) {
        time = time.toTimeString().substring(0, 8);
    }
    
    // Xử lý chuỗi thời gian
    const timeStr = String(time).trim();
    
    // Kiểm tra định dạng
    return pattern1.test(timeStr) || pattern2.test(timeStr);
};

/**
 * Hàm kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
 * @param {string|Date} start Thời gian bắt đầu
 * @param {string|Date} end Thời gian kết thúc
 */
const validateTimeRange = (start, end) => {
    try {
        // Chuẩn hóa chuỗi thời gian
        const normalizeTime = (timeInput) => {
            if (!timeInput) return null;
            
            // Nếu là đối tượng Date
            if (timeInput instanceof Date) {
                return timeInput;
            }
            
            // Nếu là chuỗi, đảm bảo định dạng HH:MM:SS
            const timeStr = String(timeInput).trim();
            if (timeStr.indexOf(':') === -1) return null;
            
            // Thêm :00 nếu chỉ là HH:MM
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                timeStr = `${timeStr}:00`;
            }
            
            return new Date(`2000-01-01T${timeStr}`);
        };
        
        const startTime = normalizeTime(start);
        const endTime = normalizeTime(end);
        
        if (!startTime || !endTime) return false;
        
        return endTime > startTime;
    } catch (error) {
        console.error('Error in validateTimeRange:', error);
        return false;
    }
};

module.exports = {
    showTimeManagement,
    getAllTimes,
    getTimeById,
    createTime,
    updateTime,
    deleteTime,
    getSchedulesByTimeId
};