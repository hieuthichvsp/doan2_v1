const adminService = require('../../services/adminService');

/**
 * Hiển thị trang quản lý học kỳ
 */
const showSemesterManagement = async (req, res) => {
    try {
        let semesters = [];
        let searchTerm = req.query.search || '';
        let searchResults = false;

        // Phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Số lượng học kỳ trên mỗi trang
        const offset = (page - 1) * limit;
        let totalSemesters = 0;
        let totalPages = 0;

        if (searchTerm) {
            // Tìm kiếm với phân trang
            const result = await adminService.semesterService.searchSemestersWithPagination(searchTerm, limit, offset);
            semesters = result.semesters;
            totalSemesters = result.count;
            searchResults = true;
        } else {
            // Lấy tất cả học kỳ với phân trang
            const result = await adminService.semesterService.getAllSemestersWithPagination(limit, offset);
            semesters = result.semesters;
            totalSemesters = result.count;
        }

        // Tính số trang
        totalPages = Math.ceil(totalSemesters / limit);

        res.render('adminView/semesterManagement', {
            title: 'Quản lý Học kỳ',
            semesters,
            user: req.session.user,
            searchTerm,
            searchResults,
            pagination: {
                page,
                limit,
                totalSemesters,
                totalPages
            }
        });
    } catch (error) {
        console.error('Controller error - showSemesterManagement:', error);
        res.status(500).render('error/500', {
            title: 'Lỗi Server',
            message: 'Không thể tải trang quản lý học kỳ',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * API lấy tất cả học kỳ
 */
const getAllSemesters = async (req, res) => {
    try {
        const semesters = await adminService.semesterService.getAllSemesters();
        res.json({ success: true, semesters });
    } catch (error) {
        console.error('Controller error - getAllSemesters:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách học kỳ' });
    }
};

/**
 * API lấy thông tin học kỳ theo ID
 */
const getSemesterById = async (req, res) => {
    try {
        const id = req.params.id;
        const semester = await adminService.semesterService.getSemesterById(id);

        if (!semester) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học kỳ' });
        }

        // Đếm số buổi học trong học kỳ
        const classSessionCount = await adminService.semesterService.countClassSessionsBySemester(id);
        semester.classSessionCount = classSessionCount;

        res.json({ success: true, semester });
    } catch (error) {
        console.error('Controller error - getSemesterById:', error);
        res.status(500).json({ success: false, message: 'Không thể tải thông tin học kỳ' });
    }
};

/**
 * API lấy danh sách buổi học trong học kỳ
 */
const getClassSessionsBySemester = async (req, res) => {
    try {
        const semesterId = req.params.id;
        const classSessions = await adminService.semesterService.getClassSessionsBySemester(semesterId);
        res.json({ success: true, classSessions });
    } catch (error) {
        console.error('Controller error - getClassSessionsBySemester:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách buổi học' });
    }
};

/**
 * API tạo học kỳ mới
 */
const createSemester = async (req, res) => {
    try {
        const { name, start_time, end_time } = req.body;

        // Validate dữ liệu đầu vào
        if (!name || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin học kỳ'
            });
        }

        // Kiểm tra tên học kỳ đã tồn tại chưa
        const existingSemester = await adminService.semesterService.getSemesterByName(name);
        if (existingSemester) {
            return res.status(400).json({
                success: false,
                message: 'Tên học kỳ đã tồn tại'
            });
        }

        // Kiểm tra thời gian bắt đầu và kết thúc
        const startTime = new Date(start_time);
        const endTime = new Date(end_time);

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
            });
        }

        // Kiểm tra học kỳ bị trùng thời gian
        const overlappingSemester = await adminService.semesterService.checkOverlappingSemester(
            startTime,
            endTime
        );

        if (overlappingSemester) {
            return res.status(400).json({
                success: false,
                message: `Thời gian học kỳ trùng với học kỳ "${overlappingSemester.name}"`
            });
        }

        // Tạo học kỳ mới
        const newSemester = await adminService.semesterService.createSemester({
            name,
            start_time: startTime,
            end_time: endTime
        });

        res.status(201).json({ success: true, semester: newSemester });
    } catch (error) {
        console.error('Controller error - createSemester:', error);
        res.status(500).json({ success: false, message: 'Không thể tạo học kỳ mới' });
    }
};

/**
 * API cập nhật thông tin học kỳ
 */
const updateSemester = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, start_time, end_time } = req.body;

        // Validate dữ liệu đầu vào
        if (!name || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin học kỳ'
            });
        }

        // Kiểm tra học kỳ tồn tại
        const existingSemester = await adminService.semesterService.getSemesterById(id);
        if (!existingSemester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học kỳ'
            });
        }

        // Kiểm tra tên học kỳ đã tồn tại chưa (trừ chính nó)
        const duplicateName = await adminService.semesterService.checkDuplicateSemesterName(name, id);
        if (duplicateName) {
            return res.status(400).json({
                success: false,
                message: 'Tên học kỳ đã tồn tại'
            });
        }

        // Kiểm tra thời gian bắt đầu và kết thúc
        const startTime = new Date(start_time);
        const endTime = new Date(end_time);

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
            });
        }

        // Kiểm tra học kỳ bị trùng thời gian (trừ chính nó)
        const overlappingSemester = await adminService.semesterService.checkOverlappingSemester(
            startTime,
            endTime,
            id
        );

        if (overlappingSemester) {
            return res.status(400).json({
                success: false,
                message: `Thời gian học kỳ trùng với học kỳ "${overlappingSemester.name}"`
            });
        }

        // Cập nhật học kỳ
        const updatedSemester = await adminService.semesterService.updateSemester(id, {
            name,
            start_time: startTime,
            end_time: endTime
        });

        res.json({ success: true, semester: updatedSemester });
    } catch (error) {
        console.error('Controller error - updateSemester:', error);
        res.status(500).json({ success: false, message: 'Không thể cập nhật học kỳ' });
    }
};

/**
 * API xóa học kỳ
 */
const deleteSemester = async (req, res) => {
    try {
        const id = req.params.id;

        // Kiểm tra học kỳ tồn tại
        const existingSemester = await adminService.semesterService.getSemesterById(id);
        if (!existingSemester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học kỳ'
            });
        }

        // Kiểm tra học kỳ có buổi học không
        const classSessionCount = await adminService.semesterService.countClassSessionsBySemester(id);
        if (classSessionCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa học kỳ này vì có ${classSessionCount} buổi học đang sử dụng`
            });
        }

        // Xóa học kỳ
        await adminService.semesterService.deleteSemester(id);

        res.json({ success: true, message: 'Xóa học kỳ thành công' });
    } catch (error) {
        console.error('Controller error - deleteSemester:', error);
        res.status(500).json({ success: false, message: 'Không thể xóa học kỳ' });
    }
};

/**
 * API kiểm tra tên học kỳ trùng lặp
 */
const checkDuplicateSemesterName = async (req, res) => {
    try {
        const name = req.query.name;
        const excludeId = req.query.excludeId ? parseInt(req.query.excludeId) : null;

        if (!name) {
            return res.status(400).json({
                exists: false,
                message: 'Thiếu tên học kỳ cần kiểm tra'
            });
        }

        const existingSemester = await adminService.semesterService.checkDuplicateSemesterName(name, excludeId);

        res.json({
            exists: !!existingSemester,
            semester: existingSemester
        });
    } catch (error) {
        console.error('Controller error - checkDuplicateSemesterName:', error);
        res.status(500).json({
            exists: false,
            message: 'Lỗi khi kiểm tra trùng lặp tên học kỳ'
        });
    }
};

module.exports = {
    showSemesterManagement,
    getAllSemesters,
    getSemesterById,
    getClassSessionsBySemester,
    createSemester,
    updateSemester,
    deleteSemester,
    checkDuplicateSemesterName
};