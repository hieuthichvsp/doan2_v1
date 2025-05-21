const classsessionTeacherService = require('../../services/teacherService/classsessionTeacherService');

// Hiển thị trang quản lý lớp học phần
const showClassSessionPage = async (req, res) => {
    try {
        res.render('TeacherView/classsessionTeacher', {
            title: 'Quản lý lớp học phần',
            user: req.user
        });
    } catch (error) {
        console.error('Error showing class session page:', error);
        res.status(500).send('Internal server error');
    }
};

// Lấy danh sách lớp học phần của giáo viên
const getClassSessions = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const classSessions = await classsessionTeacherService.getClassSessionsByTeacher(teacherId);

        res.json({
            success: true,
            classSessions
        });
    } catch (error) {
        console.error('Error getting class sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách lớp học phần'
        });
    }
};

// Lấy thông tin chi tiết lớp học phần
const getClassSessionDetail = async (req, res) => {
    try {
        const classSessionId = req.params.id;
        const teacherId = req.user.id;

        const classSession = await classsessionTeacherService.getClassSessionDetail(classSessionId, teacherId);

        if (!classSession) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học phần hoặc bạn không có quyền truy cập'
            });
        }

        res.json({
            success: true,
            classSession
        });
    } catch (error) {
        console.error('Error getting class session detail:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải thông tin lớp học phần'
        });
    }
};

// Lấy danh sách sinh viên trong lớp học phần
const getStudents = async (req, res) => {
    try {
        const classSessionId = req.params.id;
        const teacherId = req.user.id;

        const students = await classsessionTeacherService.getStudentsByClassSession(classSessionId, teacherId);

        res.json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Error getting students:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách sinh viên'
        });
    }
};

// Lấy lịch học của lớp học phần
const getSchedules = async (req, res) => {
    try {
        const classSessionId = req.params.id;
        const teacherId = req.user.id;

        const schedules = await classsessionTeacherService.getSchedulesByClassSession(classSessionId, teacherId);

        res.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Error getting schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải lịch học'
        });
    }
};

// Xuất danh sách lớp học phần ra Excel
const exportClassSessions = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const workbook = await classsessionTeacherService.exportClassSessionsToExcel(teacherId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=danh_sach_lop_hoc_phan.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting class sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xuất danh sách lớp học phần'
        });
    }
};

// Xuất danh sách sinh viên ra Excel
const exportStudents = async (req, res) => {
    try {
        const classSessionId = req.params.id;
        const teacherId = req.user.id;

        const workbook = await classsessionTeacherService.exportStudentsToExcel(classSessionId, teacherId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=danh_sach_sinh_vien_lop_${classSessionId}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting students:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xuất danh sách sinh viên'
        });
    }
};

// Xuất báo cáo chi tiết lớp học phần
const exportClassSessionReport = async (req, res) => {
    try {
        const classSessionId = req.params.id;
        const teacherId = req.user.id;

        const workbook = await classsessionTeacherService.exportClassSessionReport(classSessionId, teacherId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=bao_cao_lop_${classSessionId}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting class session report:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xuất báo cáo lớp học phần'
        });
    }
};

// Lấy danh sách học kỳ
const getSemesters = async (req, res) => {
    try {
        const semesters = await classsessionTeacherService.getSemesters();

        res.json({
            success: true,
            semesters
        });
    } catch (error) {
        console.error('Error getting semesters:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách học kỳ'
        });
    }
};

// Lấy danh sách môn học
const getSubjects = async (req, res) => {
    try {
        const subjects = await classsessionTeacherService.getSubjects();

        res.json({
            success: true,
            subjects
        });
    } catch (error) {
        console.error('Error getting subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách môn học'
        });
    }
};

module.exports = {
    showClassSessionPage,
    getClassSessions,
    getClassSessionDetail,
    getStudents,
    getSchedules,
    exportClassSessions,
    exportStudents,
    exportClassSessionReport,
    getSemesters,
    getSubjects
};