const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Lấy danh sách tất cả thời gian tiết học
 */
const getAllTimes = async () => {
    try {
        const times = await model.Time.findAll({
            order: [['start_time', 'ASC']]
        });

        return formatTimes(times);
    } catch (error) {
        console.error(`Service error - getAllTimes:`, error);
        throw error;
    }
};

/**
 * Lấy danh sách thời gian tiết học với phân trang
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const getAllTimesWithPagination = async (limit, offset) => {
    try {
        const { count, rows } = await model.Time.findAndCountAll({
            limit,
            offset,
            order: [['start_time', 'ASC']]
        });

        // Lấy số lượng lịch học cho từng tiết học
        const formattedTimes = formatTimes(rows);
        
        // Thêm thông tin số lịch học
        for (const time of formattedTimes) {
            time.scheduleCount = await countSchedulesByTime(time.id);
        }

        return {
            times: formattedTimes,
            count
        };
    } catch (error) {
        console.error(`Service error - getAllTimesWithPagination:`, error);
        throw error;
    }
};

/**
 * Tìm kiếm thời gian tiết học theo loại hoặc thời gian
 * @param {string} searchTerm - Từ khóa tìm kiếm
 */
const searchTimes = async (searchTerm) => {
    try {
        searchTerm = searchTerm.toLowerCase().trim();

        // Nếu tìm theo loại (LT hoặc TH)
        const isTypeSearch = searchTerm === 'lt' || searchTerm === 'th';

        // Tạo where clause phù hợp
        let whereClause = {};

        if (isTypeSearch) {
            whereClause.type = searchTerm.toUpperCase();
        } else {
            // Tìm theo thời gian (chuyển định dạng giờ thành chuỗi để so sánh)
            whereClause[Op.or] = [
                sequelize.where(
                    sequelize.fn('TIME_FORMAT', sequelize.col('start_time'), '%H:%i'),
                    { [Op.like]: `%${searchTerm}%` }
                ),
                sequelize.where(
                    sequelize.fn('TIME_FORMAT', sequelize.col('end_time'), '%H:%i'),
                    { [Op.like]: `%${searchTerm}%` }
                )
            ];
        }

        const times = await model.Time.findAll({
            where: whereClause,
            order: [['start_time', 'ASC']]
        });

        return formatTimes(times);
    } catch (error) {
        console.error(`Service error - searchTimes:`, error);
        throw error;
    }
};

/**
 * Tìm kiếm thời gian tiết học với phân trang
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const searchTimesWithPagination = async (searchTerm, limit, offset) => {
    try {
        searchTerm = searchTerm.toLowerCase().trim();

        // Nếu tìm theo loại (LT hoặc TH)
        const isTypeSearch = searchTerm === 'lt' || searchTerm === 'th';

        // Tạo where clause phù hợp
        let whereClause = {};

        if (isTypeSearch) {
            whereClause.type = searchTerm.toUpperCase();
        } else {
            // Tìm theo thời gian (chuyển định dạng giờ thành chuỗi để so sánh)
            whereClause[Op.or] = [
                sequelize.where(
                    sequelize.fn('TIME_FORMAT', sequelize.col('start_time'), '%H:%i'),
                    { [Op.like]: `%${searchTerm}%` }
                ),
                sequelize.where(
                    sequelize.fn('TIME_FORMAT', sequelize.col('end_time'), '%H:%i'),
                    { [Op.like]: `%${searchTerm}%` }
                )
            ];
        }

        const { count, rows } = await model.Time.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['start_time', 'ASC']]
        });

        // Lấy số lượng lịch học cho từng tiết học
        const formattedTimes = formatTimes(rows);
        
        // Thêm thông tin số lịch học
        for (const time of formattedTimes) {
            time.scheduleCount = await countSchedulesByTime(time.id);
        }

        return {
            times: formattedTimes,
            count
        };
    } catch (error) {
        console.error(`Service error - searchTimesWithPagination:`, error);
        throw error;
    }
};

/**
 * Lấy thông tin thời gian tiết học theo ID
 * @param {number} id - ID của thời gian tiết học
 */
const getTimeById = async (id) => {
    try {
        const time = await model.Time.findByPk(id);

        if (!time) {
            return null;
        }

        // Định dạng thời gian
        const timeData = formatTimes([time]);
        return timeData[0];
    } catch (error) {
        console.error(`Service error - getTimeById:`, error);
        throw error;
    }
};

/**
 * Tạo thời gian tiết học mới
 * @param {Object} timeData - Dữ liệu tiết học mới
 */
const createTime = async (timeData) => {
    try {
        const { start_time, end_time, type } = timeData;

        // Tạo tiết học mới
        const newTime = await model.Time.create({
            start_time,
            end_time,
            type
        });

        // Định dạng thời gian
        const formattedTime = formatTimes([newTime]);
        return formattedTime[0];
    } catch (error) {
        console.error(`Service error - createTime:`, error);
        throw error;
    }
};

/**
 * Cập nhật thông tin thời gian tiết học
 * @param {number} id - ID của thời gian tiết học
 * @param {Object} timeData - Dữ liệu cập nhật
 */
const updateTime = async (id, timeData) => {
    try {
        const time = await model.Time.findByPk(id);

        if (!time) {
            throw new Error('Không tìm thấy thời gian tiết học');
        }

        // Cập nhật thông tin
        await time.update(timeData);

        // Định dạng thời gian
        const formattedTime = formatTimes([time]);
        return formattedTime[0];
    } catch (error) {
        console.error(`Service error - updateTime:`, error);
        throw error;
    }
};

/**
 * Xóa thời gian tiết học
 * @param {number} id - ID của thời gian tiết học
 */
const deleteTime = async (id) => {
    try {
        const time = await model.Time.findByPk(id);

        if (!time) {
            throw new Error('Không tìm thấy thời gian tiết học');
        }

        await time.destroy();
        return true;
    } catch (error) {
        console.error(`Service error - deleteTime:`, error);
        throw error;
    }
};

/**
 * Kiểm tra trùng lặp thời gian
 * @param {string} start_time - Thời gian bắt đầu
 * @param {string} end_time - Thời gian kết thúc
 * @param {string} type - Loại tiết học (LT/TH)
 * @param {number} excludeId - ID tiết học cần loại trừ (khi cập nhật)
 */
const checkOverlappingTime = async (start_time, end_time, type, excludeId = null) => {
    try {
        // Tìm các bản ghi trùng loại và có thời gian trùng nhau
        const whereClause = {
            type,
            [Op.or]: [
                // start_time nằm trong khoảng thời gian hiện có
                {
                    start_time: {
                        [Op.lt]: end_time
                    },
                    end_time: {
                        [Op.gt]: start_time
                    }
                },
                // end_time nằm trong khoảng thời gian hiện có
                {
                    start_time: {
                        [Op.lt]: end_time
                    },
                    end_time: {
                        [Op.gt]: start_time
                    }
                }
            ]
        };

        if (excludeId) {
            whereClause.id = { [Op.ne]: excludeId };
        }

        const overlappingTime = await model.Time.findOne({
            where: whereClause
        });

        return overlappingTime;
    } catch (error) {
        console.error(`Service error - checkOverlappingTime:`, error);
        throw error;
    }
};

/**
 * Kiểm tra xem thời gian tiết học có đang được sử dụng trong lịch học không
 * @param {number} timeId - ID thời gian tiết học
 */
const checkTimeInUse = async (timeId) => {
    try {
        const count = await model.Schedule.count({
            where: { id_time: timeId }
        });

        return count > 0;
    } catch (error) {
        console.error(`Service error - checkTimeInUse:`, error);
        throw error;
    }
};

/**
 * Đếm số lịch học đang sử dụng thời gian tiết học
 * @param {number} timeId - ID thời gian tiết học
 */
const countSchedulesByTime = async (timeId) => {
    try {
        const count = await model.Schedule.count({
            where: { id_time: timeId }
        });
        
        return count;
    } catch (error) {
        console.error(`Service error - countSchedulesByTime:`, error);
        // Return 0 instead of throwing error to prevent breaking the flow
        return 0;
    }
};

/**
 * Định dạng hiển thị thời gian tiết học
 * @param {Array} times - Danh sách thời gian tiết học
 */
const formatTimes = (times) => {
    return times.map(time => {
        const plainTime = time.get ? time.get({ plain: true }) : time;

        // Định dạng thời gian thành HH:MM
        const start = plainTime.start_time ? formatTimeString(plainTime.start_time) : '';
        const end = plainTime.end_time ? formatTimeString(plainTime.end_time) : '';

        // Chuyển đổi độ dài thành phút
        const durationMinutes = calculateDuration(plainTime.start_time, plainTime.end_time);

        return {
            ...plainTime,
            start_time_formatted: start,
            end_time_formatted: end,
            duration_minutes: durationMinutes,
            duration_formatted: formatDuration(durationMinutes)
        };
    });
};

/**
 * Định dạng chuỗi thời gian thành HH:MM
 * @param {string} timeString - Chuỗi thời gian
 */
const formatTimeString = (timeString) => {
    if (!timeString) return '';

    // Xử lý chuỗi thời gian từ DB có thể có dạng HH:MM:SS
    const timeParts = timeString.toString().split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
};

/**
 * Tính thời lượng giữa hai mốc thời gian (phút)
 * @param {string} startTime - Thời gian bắt đầu
 * @param {string} endTime - Thời gian kết thúc
 */
const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    // Tính thời lượng theo phút
    return Math.round((end - start) / 60000);
};

/**
 * Định dạng thời lượng phút thành chuỗi
 * @param {number} minutes - Số phút
 */
const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${minutes} phút`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (remainingMinutes === 0) {
            return `${hours} giờ`;
        } else {
            return `${hours} giờ ${remainingMinutes} phút`;
        }
    }
};

module.exports = {
    getAllTimes,
    getAllTimesWithPagination,
    searchTimes,
    searchTimesWithPagination,
    getTimeById,
    createTime,
    updateTime,
    deleteTime,
    checkOverlappingTime,
    checkTimeInUse,
    countSchedulesByTime
};