const { ClassSession, Subject, Semester, Class, User, Schedule, sequelize } = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

// Lấy danh sách lớp học phần của giáo viên
const getClassSessionsByTeacher = async (teacherId) => {
    try {
        const classSessions = await ClassSession.findAll({
            where: {
                teacher_id: teacherId
            },
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    attributes: ['id', 'name', 'sub_code', 'credit']
                },
                {
                    model: Semester,
                    as: 'semester',
                    attributes: ['id', 'name']
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'room_code']
                }
            ],
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Enrollments
                            WHERE Enrollments.id_classsession = ClassSession.id
                        )`),
                        'student_count'
                    ]
                ]
            },
            order: [
                ['semester_id', 'DESC'],
                ['name', 'ASC']
            ]
        });

        return classSessions;
    } catch (error) {
        console.error('Error getting class sessions by teacher:', error);
        throw error;
    }
};

// Lấy thông tin chi tiết lớp học phần
const getClassSessionDetail = async (classSessionId, teacherId) => {
    try {
        // Sử dụng raw query để tránh vấn đề về association
        const [classSession] = await sequelize.query(`
            SELECT cs.*, 
                   s.name AS subject_name, 
                   s.sub_code AS subject_code, 
                   s.credit AS subject_credit,
                   sem.name AS semester_name,
                   c.room_code,
                   (SELECT COUNT(*) FROM Enrollments WHERE id_classsession = cs.id) AS student_count
            FROM ClassSessions cs
            LEFT JOIN Subjects s ON cs.sub_id = s.id
            LEFT JOIN Semesters sem ON cs.semester_id = sem.id
            LEFT JOIN Classes c ON cs.class_id = c.id
            WHERE cs.id = :classSessionId AND cs.teacher_id = :teacherId
        `, {
            replacements: { classSessionId, teacherId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!classSession) {
            return null;
        }

        // Lấy lịch học
        const schedules = await sequelize.query(`
            SELECT s.id, s.weekday, t.start_time, t.end_time, c.room_code, t.type AS period
            FROM Schedules s
            LEFT JOIN Times t ON s.id_time = t.id
            LEFT JOIN ClassSessions cs ON s.id_class_session = cs.id
            LEFT JOIN Classes c ON cs.class_id = c.id
            WHERE s.id_class_session = :classSessionId
            ORDER BY s.weekday ASC, t.start_time ASC
        `, {
            replacements: { classSessionId },
            type: sequelize.QueryTypes.SELECT
        });

        // Định dạng dữ liệu trả về
        return {
            id: classSession.id,
            class_code: classSession.class_code,
            name: classSession.name,
            type: classSession.type,
            capacity: classSession.capacity,
            teacher_id: classSession.teacher_id,
            subject: {
                id: classSession.sub_id,
                name: classSession.subject_name,
                sub_code: classSession.subject_code,
                credit: classSession.subject_credit
            },
            semester: {
                id: classSession.semester_id,
                name: classSession.semester_name
            },
            class: {
                id: classSession.class_id,
                room_code: classSession.room_code
            },
            dataValues: {
                student_count: classSession.student_count || 0
            },
            schedules: schedules || []
        };
    } catch (error) {
        console.error('Error getting class session detail:', error);
        throw error;
    }
};

// Lấy danh sách sinh viên trong lớp học phần
const getStudentsByClassSession = async (classSessionId, teacherId) => {
    try {
        // Kiểm tra xem giáo viên có quyền truy cập lớp này không
        const classSession = await ClassSession.findOne({
            where: {
                id: classSessionId,
                teacher_id: teacherId
            }
        });

        if (!classSession) {
            throw new Error('Lớp học phần không tồn tại hoặc bạn không có quyền truy cập');
        }

        // Sử dụng raw query để lấy danh sách sinh viên cùng với tỷ lệ điểm danh
        const students = await sequelize.query(`
            SELECT 
                u.id,
                u.user_code AS student_code,
                u.name,
                u.birthday AS dob,
                u.email,
                COALESCE(
                    (SELECT 
                        CAST(SUM(CASE WHEN a.status = 'Đúng giờ' OR a.status = 'Muộn' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2))
                    FROM Attendances a
                    JOIN AttendanceSessions ats ON a.attendance_session_id = ats.id
                    WHERE a.student_id = u.id
                    AND ats.class_session_id = :classSessionId
                    GROUP BY a.student_id), 
                    0
                ) AS attendance_rate
            FROM Users u
            JOIN Enrollments e ON u.id = e.id_student
            WHERE e.id_classsession = :classSessionId
            ORDER BY u.name
        `, {
            replacements: { classSessionId },
            type: sequelize.QueryTypes.SELECT
        });

        return students;
    } catch (error) {
        console.error('Error getting students by class session:', error);
        throw error;
    }
};

// Lấy lịch học của lớp học phần
const getSchedulesByClassSession = async (classSessionId, teacherId) => {
    try {
        // Kiểm tra xem giáo viên có quyền truy cập lớp này không
        const classSession = await ClassSession.findOne({
            where: {
                id: classSessionId,
                teacher_id: teacherId
            }
        });

        if (!classSession) {
            throw new Error('Lớp học phần không tồn tại hoặc bạn không có quyền truy cập');
        }

        // Lấy lịch học và thông tin phòng học qua raw query
        const schedules = await sequelize.query(`
            SELECT s.id, s.weekday, t.start_time, t.end_time, c.room_code, t.type AS period
            FROM Schedules s
            LEFT JOIN Times t ON s.id_time = t.id
            LEFT JOIN ClassSessions cs ON s.id_class_session = cs.id
            LEFT JOIN Classes c ON cs.class_id = c.id
            WHERE s.id_class_session = :classSessionId
            ORDER BY s.weekday ASC, t.start_time ASC
        `, {
            replacements: { classSessionId },
            type: sequelize.QueryTypes.SELECT
        });

        return schedules;
    } catch (error) {
        console.error('Error getting schedules by class session:', error);
        throw error;
    }
};

// Xuất danh sách lớp học phần ra Excel
const exportClassSessionsToExcel = async (teacherId) => {
    try {
        const classSessions = await getClassSessionsByTeacher(teacherId);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách lớp học phần');

        // Thêm header
        worksheet.columns = [
            { header: 'STT', key: 'stt', width: 5 },
            { header: 'Mã lớp', key: 'class_code', width: 15 },
            { header: 'Tên lớp', key: 'name', width: 30 },
            { header: 'Môn học', key: 'subject_name', width: 30 },
            { header: 'Mã môn', key: 'subject_code', width: 12 },
            { header: 'Loại', key: 'type', width: 10 },
            { header: 'Số tín chỉ', key: 'credits', width: 10 },
            { header: 'Học kỳ', key: 'semester', width: 15 },
            { header: 'Phòng', key: 'room', width: 10 },
            { header: 'Số sinh viên', key: 'student_count', width: 12 }
        ];

        // Style cho header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Thêm dữ liệu
        classSessions.forEach((session, index) => {
            worksheet.addRow({
                stt: index + 1,
                class_code: session.class_code || '---',
                name: session.name,
                subject_name: session.subject ? session.subject.name : '---',
                subject_code: session.subject ? session.subject.sub_code : '---',
                type: session.type === 'LT' ? 'Lý thuyết' : 'Thực hành',
                credits: session.subject ? session.subject.credit : '---',
                semester: session.semester ? session.semester.name : '---',
                room: session.class ? session.class.room_code : '---',
                student_count: session.dataValues?.student_count || 0
            });
        });

        // Định dạng bảng
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.alignment = { vertical: 'middle' };
            }
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        return workbook;
    } catch (error) {
        console.error('Error exporting class sessions to Excel:', error);
        throw error;
    }
};

// Xuất danh sách sinh viên ra Excel
const exportStudentsToExcel = async (classSessionId, teacherId) => {
    try {
        const students = await getStudentsByClassSession(classSessionId, teacherId);
        const classSession = await getClassSessionDetail(classSessionId, teacherId);

        if (!classSession) {
            throw new Error('Lớp học phần không tồn tại hoặc bạn không có quyền truy cập');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách sinh viên');

        // Thêm tiêu đề
        worksheet.mergeCells('A1:H1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `DANH SÁCH SINH VIÊN LỚP ${classSession.name}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };

        // Thêm thông tin lớp
        worksheet.mergeCells('A2:H2');
        const infoCell = worksheet.getCell('A2');
        infoCell.value = `Môn học: ${classSession.subject ? classSession.subject.name : '---'} | Học kỳ: ${classSession.semester ? classSession.semester.name : '---'} | Loại: ${classSession.type === 'LT' ? 'Lý thuyết' : 'Thực hành'}`;
        infoCell.alignment = { horizontal: 'center' };

        // Thêm header cho bảng
        worksheet.addRow(['']);
        worksheet.addRow([
            'STT', 'MSSV', 'Họ tên', 'Lớp', 'Ngày sinh', 'Email', 'Số điện thoại', 'Tỉ lệ đi học (%)'
        ]);

        // Style cho header
        const headerRow = worksheet.getRow(4);
        headerRow.font = { bold: true };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Thêm dữ liệu sinh viên
        students.forEach((student, index) => {
            const dob = student.dob ? new Date(student.dob) : null;
            const formattedDate = dob ? `${dob.getDate().toString().padStart(2, '0')}/${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getFullYear()}` : '---';

            worksheet.addRow([
                index + 1,
                student.student_code || '---',
                student.name,
                '---', // Không có class_name nên để mặc định
                formattedDate,
                student.email || '---',
                '---', // Không có phone nên để mặc định
                student.attendance_rate || 0
            ]);
        });

        // Định dạng bảng
        worksheet.getColumn(1).width = 5;
        worksheet.getColumn(2).width = 12;
        worksheet.getColumn(3).width = 25;
        worksheet.getColumn(4).width = 15;
        worksheet.getColumn(5).width = 15;
        worksheet.getColumn(6).width = 25;
        worksheet.getColumn(7).width = 15;
        worksheet.getColumn(8).width = 15;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 4) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Thêm chân trang
        const lastRow = worksheet.rowCount + 2;
        worksheet.mergeCells(`A${lastRow}:H${lastRow}`);
        const footerCell = worksheet.getCell(`A${lastRow}`);
        const today = new Date().toLocaleDateString('vi-VN');
        footerCell.value = `Ngày xuất báo cáo: ${today}`;
        footerCell.alignment = { horizontal: 'right' };

        return workbook;
    } catch (error) {
        console.error('Error exporting students to Excel:', error);
        throw error;
    }
};

// Xuất báo cáo chi tiết lớp học phần
const exportClassSessionReport = async (classSessionId, teacherId) => {
    try {
        const classSession = await getClassSessionDetail(classSessionId, teacherId);

        if (!classSession) {
            throw new Error('Lớp học phần không tồn tại hoặc bạn không có quyền truy cập');
        }

        const students = await getStudentsByClassSession(classSessionId, teacherId);
        const schedules = await getSchedulesByClassSession(classSessionId, teacherId);

        const workbook = new ExcelJS.Workbook();

        // Tạo worksheet thông tin lớp
        const infoSheet = workbook.addWorksheet('Thông tin lớp');

        // Thêm tiêu đề
        infoSheet.mergeCells('A1:E1');
        const titleCell = infoSheet.getCell('A1');
        titleCell.value = `BÁO CÁO LỚP HỌC PHẦN: ${classSession.name}`;
        titleCell.font = { bold: true, size: 16 };
        titleCell.alignment = { horizontal: 'center' };

        // Thêm thông tin cơ bản
        infoSheet.addRow(['']);
        infoSheet.addRow(['Mã lớp:', classSession.class_code || '---']);
        infoSheet.addRow(['Tên lớp:', classSession.name]);
        infoSheet.addRow(['Môn học:', classSession.subject ? classSession.subject.name : '---']);
        infoSheet.addRow(['Mã môn học:', classSession.subject ? classSession.subject.sub_code : '---']);
        infoSheet.addRow(['Số tín chỉ:', classSession.subject ? classSession.subject.credit : '---']);
        infoSheet.addRow(['Loại lớp:', classSession.type === 'LT' ? 'Lý thuyết' : 'Thực hành']);
        infoSheet.addRow(['Học kỳ:', classSession.semester ? classSession.semester.name : '---']);
        infoSheet.addRow(['Phòng học:', classSession.class ? classSession.class.room_code : '---']);
        infoSheet.addRow(['Số sinh viên:', classSession.dataValues.student_count || 0]);

        // Định dạng cột thông tin
        infoSheet.getColumn(1).width = 15;
        infoSheet.getColumn(2).width = 30;

        // Style cho các ô thông tin
        for (let i = 3; i <= 10; i++) {
            infoSheet.getRow(i).getCell(1).font = { bold: true };
        }

        // Thêm bảng lịch học
        infoSheet.addRow(['']);
        infoSheet.addRow(['LỊCH HỌC']);
        infoSheet.getRow(12).getCell(1).font = { bold: true, size: 14 };

        infoSheet.addRow(['']);
        const scheduleHeaderRow = infoSheet.addRow(['Thứ', 'Tiết', 'Phòng', 'Thời gian']);
        scheduleHeaderRow.font = { bold: true };

        // Thêm lịch học
        if (schedules && schedules.length > 0) {
            // Danh sách tên các thứ trong tuần
            const weekdayNames = {
                1: 'Thứ Hai',
                2: 'Thứ Ba',
                3: 'Thứ Tư',
                4: 'Thứ Năm',
                5: 'Thứ Sáu',
                6: 'Thứ Bảy',
                7: 'Chủ Nhật'
            };

            schedules.forEach(schedule => {
                const startTime = schedule.start_time ? schedule.start_time.substring(0, 5) : '---';
                const endTime = schedule.end_time ? schedule.end_time.substring(0, 5) : '---';

                infoSheet.addRow([
                    weekdayNames[schedule.weekday] || `Thứ ${schedule.weekday}`,
                    schedule.period || '---',
                    schedule.room_code || '---',
                    `${startTime} - ${endTime}`
                ]);
            });
        } else {
            infoSheet.addRow(['Chưa có lịch học', '', '', '']);
        }

        // Định dạng bảng lịch học
        infoSheet.getColumn(1).width = 15;
        infoSheet.getColumn(2).width = 10;
        infoSheet.getColumn(3).width = 15;
        infoSheet.getColumn(4).width = 20;

        // Tạo worksheet danh sách sinh viên
        const studentSheet = workbook.addWorksheet('Danh sách sinh viên');

        // Thêm tiêu đề
        studentSheet.mergeCells('A1:H1');
        const studentTitleCell = studentSheet.getCell('A1');
        studentTitleCell.value = `DANH SÁCH SINH VIÊN LỚP ${classSession.name}`;
        studentTitleCell.font = { bold: true, size: 14 };
        studentTitleCell.alignment = { horizontal: 'center' };

        // Thêm header cho bảng
        studentSheet.addRow(['']);
        const studentHeaderRow = studentSheet.addRow([
            'STT', 'MSSV', 'Họ tên', 'Lớp', 'Ngày sinh', 'Email', 'Số điện thoại', 'Tỉ lệ đi học (%)'
        ]);
        studentHeaderRow.font = { bold: true };

        // Thêm dữ liệu sinh viên
        if (students && students.length > 0) {
            students.forEach((student, index) => {
                const dob = student.dob ? new Date(student.dob) : null;
                const formattedDate = dob ? `${dob.getDate().toString().padStart(2, '0')}/${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getFullYear()}` : '---';

                studentSheet.addRow([
                    index + 1,
                    student.student_code || '---',
                    student.name,
                    '---', // Không có class_name nên để mặc định
                    formattedDate,
                    student.email || '---',
                    '---', // Không có phone nên để mặc định
                    student.attendance_rate || 0
                ]);
            });
        } else {
            studentSheet.addRow(['Không có sinh viên', '', '', '', '', '', '', '']);
        }

        // Định dạng bảng sinh viên
        studentSheet.getColumn(1).width = 5;
        studentSheet.getColumn(2).width = 12;
        studentSheet.getColumn(3).width = 25;
        studentSheet.getColumn(4).width = 15;
        studentSheet.getColumn(5).width = 15;
        studentSheet.getColumn(6).width = 25;
        studentSheet.getColumn(7).width = 15;
        studentSheet.getColumn(8).width = 15;

        // Định dạng border cho bảng
        studentSheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 3) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Thêm chân trang
        const lastRow = studentSheet.rowCount + 2;
        studentSheet.mergeCells(`A${lastRow}:H${lastRow}`);
        const footerCell = studentSheet.getCell(`A${lastRow}`);
        const today = new Date().toLocaleDateString('vi-VN');
        footerCell.value = `Ngày xuất báo cáo: ${today}`;
        footerCell.alignment = { horizontal: 'right' };

        return workbook;
    } catch (error) {
        console.error('Error exporting class session report:', error);
        throw error;
    }
};

// Sửa lại getSemesters để không sử dụng year và term
const getSemesters = async () => {
    try {
        const semesters = await Semester.findAll({
            order: [['end_time', 'DESC'], ['name', 'ASC']]
        });

        return semesters;
    } catch (error) {
        console.error('Error getting semesters:', error);
        throw error;
    }
};

// Lấy danh sách môn học
const getSubjects = async () => {
    try {
        const subjects = await Subject.findAll({
            order: [['name', 'ASC']]
        });

        return subjects;
    } catch (error) {
        console.error('Error getting subjects:', error);
        throw error;
    }
};

module.exports = {
    getClassSessionsByTeacher,
    getClassSessionDetail,
    getStudentsByClassSession,
    getSchedulesByClassSession,
    exportClassSessionsToExcel,
    exportStudentsToExcel,
    exportClassSessionReport,
    getSemesters,
    getSubjects
};