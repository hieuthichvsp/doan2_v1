const adminService = require('../../services/adminService');
const excel = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * Format date to DD/MM/YYYY
 */
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
        ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
        : 'N/A';
};

/**
 * Format time to HH:MM
 */
const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // For MySQL TIME format
    if (typeof timeString === 'string' && timeString.includes(':')) {
        const parts = timeString.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
    }
    // For Date objects
    if (timeString instanceof Date) {
        return `${String(timeString.getHours()).padStart(2, '0')}:${String(timeString.getMinutes()).padStart(2, '0')}`;
    }
    return 'N/A';
};

/**
 * Format weekday to Vietnamese names
 */
const formatWeekday = (weekday) => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return weekday >= 0 && weekday < days.length ? days[weekday] : 'N/A';
};

/**
 * Hiển thị trang quản lý học phần
 */
const showClassSessionManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';

        // Lấy các điều kiện lọc từ query params
        const filters = {
            type: req.query.type || null,
            subject: req.query.subject || null,
            semester: req.query.semester || null
        };

        const data = await adminService.classsessionService.getAllClassSessions(page, limit, searchTerm, filters);

        // Format dates and times for display
        const formattedClassSessions = data.classSessions.map(session => ({
            ...session,
            formattedStartTime: formatTime(session.start_time),
            formattedEndTime: formatTime(session.end_time)
        }));

        // Get subjects, semesters, classrooms for dropdowns
        const subjects = await adminService.subjectService.getAllSubjects();
        const semesters = await adminService.semesterService.getAllSemesters();
        const classrooms = await adminService.classroomService.getAllClassrooms();
        const classes = await adminService.classroomService.getAllClassrooms();
        const teachers = await adminService.userService.getTeachers();

        res.render('adminView/classsessionManagement', {
            title: 'Quản lý học phần',
            classSessions: formattedClassSessions,
            pagination: {
                page: data.currentPage,
                totalPages: data.totalPages,
                totalItems: data.totalItems,
                limit: data.limit
            },
            searchTerm,
            searchResults: searchTerm !== '' || filters.type || filters.subject || filters.semester,
            filters, // Trả về filters để hiển thị trạng thái đã chọn trong form
            subjects,
            semesters,
            classrooms,
            classes,
            teachers
        });
    } catch (error) {
        console.error('Error in showClassSessionManagement controller:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang quản lý học phần',
            error
        });
    }
};

/**
 * Lấy danh sách tất cả học phần
 */
const getAllClassSessions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';

        const data = await adminService.classsessionService.getAllClassSessions(page, limit, searchTerm);

        res.json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error('Error in getAllClassSessions controller:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách học phần'
        });
    }
};

/**
 * Lấy chi tiết học phần theo ID
 */
const getClassSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.classsessionService.getClassSessionById(id);

        if (result.success) {
            // Xử lý và làm phẳng các đối tượng Sequelize để tránh circular references
            // Format schedules và chuyển đổi thành đối tượng thuần JavaScript
            if (result.classSession.schedules && result.classSession.schedules.length > 0) {
                result.classSession.schedules = result.classSession.schedules.map(schedule => {
                    // Đảm bảo chuyển đối tượng Sequelize thành plain object
                    const plainSchedule = schedule.toJSON ? schedule.toJSON() : { ...schedule };

                    // Thêm thông tin định dạng weekday
                    const weekdayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                    const formattedWeekday = plainSchedule.weekday >= 0 && plainSchedule.weekday < weekdayNames.length ?
                        weekdayNames[plainSchedule.weekday] : 'N/A';

                    return {
                        ...plainSchedule,
                        formattedWeekday
                    };
                });
            }

            // Tạo một đối tượng kết quả mới chỉ chứa dữ liệu cần thiết
            const responseData = {
                success: true,
                classSession: {
                    ...result.classSession
                }
            };

            return res.status(200).json(responseData);
        } else {
            return res.status(404).json({
                success: false,
                message: result.message || 'Không tìm thấy học phần'
            });
        }
    } catch (error) {
        console.error('Error in getClassSessionById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy chi tiết học phần'
        });
    }
};

/**
 * Lấy danh sách sinh viên đã đăng ký học phần
 */
const getEnrolledStudents = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Fetching enrolled students for class session ID:', id);
        const result = await adminService.classsessionService.getEnrolledStudents(id);

        if (result.success) {
            // Debug data
            console.log('Enrolled students data:', JSON.stringify(result.enrollments.map(e => e.student), null, 2));

            return res.status(200).json({
                success: true,
                students: result.enrollments.map(enrollment => enrollment.student)
            });
        } else {
            return res.status(404).json({
                success: false,
                message: result.message || 'Không tìm thấy dữ liệu sinh viên'
            });
        }
    } catch (error) {
        console.error('Error in getEnrolledStudents controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách sinh viên đã đăng ký'
        });
    }
};

/**
 * Tạo học phần mới
 */
const createClassSession = async (req, res) => {
    try {
        const result = await adminService.classsessionService.createClassSession(req.body);

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                classSession: result.classSession
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in createClassSession controller:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo học phần'
        });
    }
};

/**
 * Cập nhật thông tin học phần
 */
const updateClassSession = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.classsessionService.updateClassSession(id, req.body);

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                classSession: result.classSession
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in updateClassSession controller:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật học phần'
        });
    }
};

/**
 * Xóa học phần
 */
const deleteClassSession = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Gọi service để xóa học phần và tất cả dữ liệu liên quan
        const result = await adminService.classsessionService.deleteClassSession(id);
        
        res.json(result);
    } catch (error) {
        console.error('Error in deleteClassSession controller:', error);
        res.status(500).json({
            success: false,
            message: `Có lỗi xảy ra khi xóa học phần: ${error.message}`
        });
    }
};

/**
 * Kiểm tra mã học phần trùng lặp
 */
const checkDuplicateClassCode = async (req, res) => {
    try {
        const { code, excludeId } = req.query;
        const result = await adminService.classsessionService.checkDuplicateClassCode(code, excludeId);

        res.json({
            success: true,
            exists: result.exists
        });
    } catch (error) {
        console.error('Error in checkDuplicateClassCode controller:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi kiểm tra mã học phần'
        });
    }
};

/**
 * Lấy lịch học của học phần
 */
const getClassSessionSchedules = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.classsessionService.getClassSessionSchedules(id);

        if (result.success) {
            // Format dates for display
            const formattedSchedules = result.schedules.map(schedule => ({
                ...schedule.toJSON(),
                formattedWeekday: formatWeekday(schedule.weekday)
            }));

            res.json({
                success: true,
                schedules: formattedSchedules
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in getClassSessionSchedules controller:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy lịch học'
        });
    }
};

/**
 * Kiểm tra xung đột lịch học
 */
const checkScheduleConflict = async (req, res) => {
    try {
        const { weekday, timeId, classId, teacherId } = req.query;
        
        if (!weekday || !timeId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin thứ hoặc khung giờ'
            });
        }
        
        // Kiểm tra xung đột với phòng học
        if (classId) {
            const roomConflict = await adminService.scheduleService.checkRoomConflict(
                parseInt(weekday),
                parseInt(timeId),
                parseInt(classId)
            );
            
            if (roomConflict.isConflict) {
                return res.json(roomConflict);
            }
        }
        
        // Kiểm tra xung đột với giáo viên
        if (teacherId) {
            const teacherConflict = await adminService.scheduleService.checkTeacherConflict(
                parseInt(weekday),
                parseInt(timeId),
                parseInt(teacherId)
            );
            
            if (teacherConflict.isConflict) {
                return res.json(teacherConflict);
            }
        }
        
        // Không có xung đột
        return res.json({
            success: true,
            isConflict: false
        });
    } catch (error) {
        console.error('Error in checkScheduleConflict controller:', error);
        return res.status(500).json({
            success: false,
            isConflict: true,
            message: 'Lỗi server khi kiểm tra xung đột'
        });
    }
};

/**
 * Tạo lịch học mới
 */
const createSchedule = async (req, res) => {
    try {
        const { weekday, id_time, id_class_session } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!weekday && weekday !== 0 || !id_time || !id_class_session) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin cần thiết'
            });
        }

        // Tạo lịch học mới
        const newSchedule = await adminService.scheduleService.createSchedule({
            weekday, 
            id_time,
            id_class_session
        });
        
        return res.json({
            success: true,
            message: 'Tạo lịch học thành công',
            schedule: newSchedule
        });
    } catch (error) {
        console.error('Error in createSchedule controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo lịch học'
        });
    }
};

/**
 * Cập nhật lịch học
 */
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { weekday, id_time, id_class_session } = req.body;
        
        if (!id || (!weekday && weekday !== 0) || !id_time) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin cần thiết'
            });
        }
        
        // Kiểm tra lịch học tồn tại
        const scheduleResult = await adminService.scheduleService.getScheduleById(id);
        
        if (!scheduleResult.success) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch học'
            });
        }
        
        const schedule = scheduleResult.data;
        const classSessionId = id_class_session || schedule.id_class_session;
        
        // Kiểm tra xung đột lịch học
        const conflictCheck = await adminService.scheduleService.checkScheduleConflict(
            parseInt(weekday),
            parseInt(id_time),
            classSessionId,
            parseInt(id)
        );
        
        if (conflictCheck.isConflict) {
            return res.status(400).json({
                success: false,
                message: conflictCheck.message
            });
        }
        
        // Cập nhật lịch học
        const updateResult = await adminService.scheduleService.updateSchedule(id, {
            weekday,
            id_time
        });
        
        return res.json(updateResult);
    } catch (error) {
        console.error('Error in updateSchedule controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật lịch học'
        });
    }
};

/**
 * Xóa lịch học
 */
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra lịch học tồn tại
        const scheduleResult = await adminService.scheduleService.getScheduleById(id);
        
        if (!scheduleResult.success) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch học'
            });
        }
        
        // Xóa lịch học
        await model.Schedule.destroy({
            where: { id }
        });
        
        return res.json({
            success: true,
            message: 'Xóa lịch học thành công'
        });
    } catch (error) {
        console.error('Error in deleteSchedule controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa lịch học'
        });
    }
};

/**
 * Xuất danh sách sinh viên của học phần ra file Excel
 */
const exportStudentList = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Lấy thông tin chi tiết về học phần
        const classSessionResult = await adminService.classsessionService.getClassSessionById(id);
        
        if (!classSessionResult.success) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học phần'
            });
        }
        
        const classSession = classSessionResult.classSession;
        
        // Lấy danh sách sinh viên đã đăng ký
        const enrolledStudentsResult = await adminService.classsessionService.getEnrolledStudents(id);
        
        if (!enrolledStudentsResult.success) {
            return res.status(404).json({
                success: false,
                message: 'Không thể lấy danh sách sinh viên'
            });
        }
        
        // Tạo workbook và worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách sinh viên');
        
        // Thêm thông tin học phần vào đầu file
        worksheet.addRow(['THÔNG TIN LỚP HỌC PHẦN']);
        worksheet.addRow(['']);
        worksheet.addRow(['Mã học phần:', classSession.class_code]);
        worksheet.addRow(['Tên học phần:', classSession.name]);
        worksheet.addRow(['Loại:', classSession.type === 'LT' ? 'Lý thuyết' : 'Thực hành']);
        worksheet.addRow(['Môn học:', classSession.subject ? classSession.subject.name : 'N/A']);
        worksheet.addRow(['Học kỳ:', classSession.semester ? classSession.semester.name : 'N/A']);
        worksheet.addRow(['Lớp:', classSession.class ? classSession.class.name : 'N/A']);
        worksheet.addRow(['Giảng viên:', classSession.teacher ? classSession.teacher.name : 'Chưa phân công']);
        worksheet.addRow(['Sĩ số:', classSession.capacity]);
        worksheet.addRow(['Đã đăng ký:', enrolledStudentsResult.enrollments.length]);
        worksheet.addRow(['Còn trống:', classSession.capacity - enrolledStudentsResult.enrollments.length]);
        worksheet.addRow(['']);
        
        // Định dạng header
        for (let i = 1; i <= 11; i++) {
            const headerRow = worksheet.getRow(i);
            headerRow.font = { bold: true };
            if (i === 1) {
                headerRow.font = { bold: true, size: 16 };
                worksheet.mergeCells(`A1:B1`);
                headerRow.alignment = { horizontal: 'center' };
            }
        }
        
        // Thêm danh sách sinh viên
        worksheet.addRow(['DANH SÁCH SINH VIÊN']);
        worksheet.mergeCells(`A13:D13`);
        const headerTitleRow = worksheet.getRow(13);
        headerTitleRow.font = { bold: true, size: 14 };
        headerTitleRow.alignment = { horizontal: 'center' };
        
        // Header của bảng sinh viên
        worksheet.addRow(['STT', 'MSSV', 'Họ tên', 'Email']);
        const headerRow = worksheet.getRow(14);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        
        // Style cho cells
        ['A', 'B', 'C', 'D'].forEach(col => {
            worksheet.getColumn(col).width = col === 'A' ? 10 : (col === 'C' ? 30 : 25);
            worksheet.getColumn(col).alignment = col === 'A' ? { horizontal: 'center' } : { horizontal: 'left' };
        });
        
        // Thêm dữ liệu sinh viên
        if (enrolledStudentsResult.enrollments.length > 0) {
            enrolledStudentsResult.enrollments.forEach((enrollment, index) => {
                if (enrollment.student) {
                    worksheet.addRow([
                        index + 1,
                        enrollment.student.user_code,
                        enrollment.student.name,
                        enrollment.student.email || 'N/A'
                    ]);
                }
            });
        } else {
            worksheet.addRow(['', 'Chưa có sinh viên đăng ký']);
            worksheet.mergeCells(`B15:D15`);
        }
        
        // Thêm border cho bảng
        const tableStartRow = 14;
        const tableEndRow = Math.max(15, 14 + enrolledStudentsResult.enrollments.length);
        
        for (let i = tableStartRow; i <= tableEndRow; i++) {
            ['A', 'B', 'C', 'D'].forEach(col => {
                worksheet.getCell(`${col}${i}`).border = {
                    top: {style:'thin'},
                    left: {style:'thin'},
                    bottom: {style:'thin'},
                    right: {style:'thin'}
                };
            });
        }
        
        // Tạo thư mục temp nếu chưa tồn tại
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Tên file sẽ là mã học phần
        const fileName = `DanhSach_${classSession.class_code.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
        const filePath = path.join(tempDir, fileName);
        
        // Lưu file
        await workbook.xlsx.writeFile(filePath);
        
        // Trả về file cho client
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra khi tải file'
                });
            }
            
            // Xóa file sau khi đã gửi xong
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        });
    } catch (error) {
        console.error('Error in exportStudentList controller:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xuất danh sách sinh viên'
        });
    }
};

// Cập nhật module.exports
module.exports = {
    showClassSessionManagement,
    getAllClassSessions,
    getClassSessionById,
    createClassSession,
    updateClassSession,
    deleteClassSession,
    checkDuplicateClassCode,
    getEnrolledStudents,
    getClassSessionSchedules,
    checkScheduleConflict,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    exportStudentList
};