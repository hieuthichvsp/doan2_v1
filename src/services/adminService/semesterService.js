const model = require('../../models');
const { Op } = require('sequelize');

/**
 * Hàm định dạng ngày tháng sang chuỗi dd/mm/yyyy
 * @param {Date} date - Đối tượng Date cần định dạng
 * @returns {string} Chuỗi ngày đã định dạng
 */
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Lấy danh sách tất cả học kỳ
 */
const getAllSemesters = async () => {
    try {
        const semesters = await model.Semester.findAll({
            order: [['start_time', 'DESC']]
        });

        // Thêm trạng thái và định dạng ngày tháng
        return formatSemesters(semesters);
    } catch (error) {
        console.error(`Service error - getAllSemesters:`, error);
        throw error;
    }
};

/**
 * Lấy danh sách học kỳ có phân trang
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const getAllSemestersWithPagination = async (limit, offset) => {
    try {
        const { count, rows } = await model.Semester.findAndCountAll({
            limit,
            offset,
            order: [['start_time', 'DESC']]
        });

        // Thêm trạng thái và định dạng ngày tháng
        const semesters = formatSemesters(rows);

        return {
            semesters,
            count
        };
    } catch (error) {
        console.error(`Service error - getAllSemestersWithPagination:`, error);
        throw error;
    }
};

/**
 * Tìm kiếm học kỳ theo tên
 * @param {string} searchTerm - Từ khóa tìm kiếm
 */
const searchSemesters = async (searchTerm) => {
    try {
        const semesters = await model.Semester.findAll({
            where: {
                name: {
                    [Op.like]: `%${searchTerm}%`
                }
            },
            order: [['start_time', 'DESC']]
        });

        // Thêm trạng thái và định dạng ngày tháng
        return formatSemesters(semesters);
    } catch (error) {
        console.error(`Service error - searchSemesters(${searchTerm}):`, error);
        throw error;
    }
};

/**
 * Tìm kiếm học kỳ theo tên có phân trang
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {number} limit - Số lượng bản ghi mỗi trang
 * @param {number} offset - Vị trí bắt đầu
 */
const searchSemestersWithPagination = async (searchTerm, limit, offset) => {
    try {
        const { count, rows } = await model.Semester.findAndCountAll({
            where: {
                name: {
                    [Op.like]: `%${searchTerm}%`
                }
            },
            limit,
            offset,
            order: [['start_time', 'DESC']]
        });

        // Thêm trạng thái và định dạng ngày tháng
        const semesters = formatSemesters(rows);

        return {
            semesters,
            count
        };
    } catch (error) {
        console.error(`Service error - searchSemestersWithPagination(${searchTerm}):`, error);
        throw error;
    }
};

/**
 * Lấy học kỳ theo ID
 * @param {number} id - ID học kỳ
 */
const getSemesterById = async (id) => {
    try {
        const semester = await model.Semester.findByPk(id);
        if (!semester) {
            return null;
        }

        // Thêm trạng thái và định dạng ngày tháng
        const formattedSemesters = formatSemesters([semester]);
        return formattedSemesters[0];
    } catch (error) {
        console.error(`Service error - getSemesterById(${id}):`, error);
        throw error;
    }
};

/**
 * Lấy học kỳ theo tên
 * @param {string} name - Tên học kỳ
 */
const getSemesterByName = async (name) => {
    try {
        const semester = await model.Semester.findOne({
            where: { name }
        });
        return semester;
    } catch (error) {
        console.error(`Service error - getSemesterByName(${name}):`, error);
        throw error;
    }
};

/**
 * Kiểm tra tên học kỳ trùng lặp
 * @param {string} name - Tên học kỳ
 * @param {number} excludeId - ID học kỳ cần loại trừ (khi cập nhật)
 */
const checkDuplicateSemesterName = async (name, excludeId = null) => {
    try {
        const whereClause = { name };
        if (excludeId) {
            whereClause.id = { [Op.ne]: excludeId };
        }

        const semester = await model.Semester.findOne({
            where: whereClause
        });

        return semester;
    } catch (error) {
        console.error(`Service error - checkDuplicateSemesterName(${name}, ${excludeId}):`, error);
        throw error;
    }
};

/**
 * Kiểm tra học kỳ trùng thời gian
 * @param {Date} startTime - Thời gian bắt đầu
 * @param {Date} endTime - Thời gian kết thúc
 * @param {number} excludeId - ID học kỳ cần loại trừ (khi cập nhật)
 */
const checkOverlappingSemester = async (startTime, endTime, excludeId = null) => {
    try {
        const whereClause = {
            [Op.or]: [
                // Trường hợp 1: startTime nằm trong học kỳ hiện có
                {
                    start_time: { [Op.lte]: startTime },
                    end_time: { [Op.gte]: startTime }
                },
                // Trường hợp 2: endTime nằm trong học kỳ hiện có
                {
                    start_time: { [Op.lte]: endTime },
                    end_time: { [Op.gte]: endTime }
                },
                // Trường hợp 3: học kỳ mới bao trùm học kỳ hiện có
                {
                    start_time: { [Op.gte]: startTime },
                    end_time: { [Op.lte]: endTime }
                }
            ]
        };

        if (excludeId) {
            whereClause.id = { [Op.ne]: excludeId };
        }

        const overlappingSemester = await model.Semester.findOne({
            where: whereClause
        });

        return overlappingSemester;
    } catch (error) {
        console.error(`Service error - checkOverlappingSemester:`, error);
        throw error;
    }
};

/**
 * Tạo học kỳ mới
 * @param {Object} semesterData - Dữ liệu học kỳ
 */
const createSemester = async (semesterData) => {
    try {
        const { name, start_time, end_time } = semesterData;

        const newSemester = await model.Semester.create({
            name,
            start_time,
            end_time
        });

        // Thêm trạng thái và định dạng ngày tháng
        const formattedSemesters = formatSemesters([newSemester]);
        return formattedSemesters[0];
    } catch (error) {
        console.error(`Service error - createSemester:`, error);
        throw error;
    }
};

/**
 * Cập nhật học kỳ
 * @param {number} id - ID học kỳ
 * @param {Object} semesterData - Dữ liệu học kỳ
 */
const updateSemester = async (id, semesterData) => {
    try {
        const { name, start_time, end_time } = semesterData;

        const semester = await model.Semester.findByPk(id);
        if (!semester) {
            throw new Error(`Không tìm thấy học kỳ với ID: ${id}`);
        }

        await semester.update({
            name,
            start_time,
            end_time
        });

        // Thêm trạng thái và định dạng ngày tháng
        const formattedSemesters = formatSemesters([semester]);
        return formattedSemesters[0];
    } catch (error) {
        console.error(`Service error - updateSemester(${id}):`, error);
        throw error;
    }
};

/**
 * Xóa học kỳ
 * @param {number} id - ID học kỳ
 */
const deleteSemester = async (id) => {
    try {
        const semester = await model.Semester.findByPk(id);
        if (!semester) {
            throw new Error(`Không tìm thấy học kỳ với ID: ${id}`);
        }

        await semester.destroy();
        return true;
    } catch (error) {
        console.error(`Service error - deleteSemester(${id}):`, error);
        throw error;
    }
};

/**
 * Lấy danh sách buổi học trong học kỳ
 * @param {number} semesterId - ID học kỳ
 */
const getClassSessionsBySemester = async (semesterId) => {
    try {
        const classSessions = await model.ClassSession.findAll({
            where: {
                semester_id: semesterId
            },
            include: [
                {
                    model: model.Class,
                    as: 'class'
                },
                {
                    model: model.Subject,
                    as: 'subject'
                }
            ],
            order: [['date', 'ASC'], ['start_time', 'ASC']]
        });

        // Định dạng ngày tháng cho buổi học
        return classSessions.map(session => {
            const plainSession = session.get({ plain: true });
            return {
                ...plainSession,
                date_formatted: formatDate(plainSession.date),
                start_time_formatted: plainSession.start_time?.substring(0, 5) || '',
                end_time_formatted: plainSession.end_time?.substring(0, 5) || ''
            };
        });
    } catch (error) {
        console.error(`Service error - getClassSessionsBySemester(${semesterId}):`, error);
        throw error;
    }
};

/**
 * Đếm số buổi học trong học kỳ
 * @param {number} semesterId - ID học kỳ
 */
const countClassSessionsBySemester = async (semesterId) => {
    try {
        const count = await model.ClassSession.count({
            where: {
                semester_id: semesterId
            }
        });

        return count;
    } catch (error) {
        console.error(`Service error - countClassSessionsBySemester(${semesterId}):`, error);
        throw error;
    }
};

/**
 * Hàm hỗ trợ định dạng học kỳ
 * @param {Array} semesters - Danh sách học kỳ
 */
const formatSemesters = (semesters) => {
    const now = new Date();

    return semesters.map(semester => {
        const plainSemester = semester.get ? semester.get({ plain: true }) : semester;
        const startTime = new Date(plainSemester.start_time);
        const endTime = new Date(plainSemester.end_time);

        // Xác định trạng thái học kỳ
        let status = 'past'; // Đã kết thúc
        if (now >= startTime && now <= endTime) {
            status = 'active'; // Đang diễn ra
        } else if (now < startTime) {
            status = 'upcoming'; // Sắp tới
        }

        return {
            ...plainSemester,
            status,
            start_time_formatted: formatDate(startTime),
            end_time_formatted: formatDate(endTime)
        };
    });
};

/**
 * Lấy học kỳ đang hoạt động hiện tại
 */
const getCurrentActiveSemester = async () => {
    try {
        const currentDate = new Date();
        
        const activeSemester = await model.Semester.findOne({
            where: {
                start_time: {
                    [Op.lte]: currentDate
                },
                end_time: {
                    [Op.gte]: currentDate
                },
                status: 'active'
            }
        });
        
        return activeSemester;
    } catch (error) {
        console.error('Error in getCurrentActiveSemester service:', error);
        throw error;
    }
};

module.exports = {
    getAllSemesters,
    getAllSemestersWithPagination,
    searchSemesters,
    searchSemestersWithPagination,
    getSemesterById,
    getSemesterByName,
    checkDuplicateSemesterName,
    checkOverlappingSemester,
    createSemester,
    updateSemester,
    deleteSemester,
    getClassSessionsBySemester,
    countClassSessionsBySemester,
    getCurrentActiveSemester
};