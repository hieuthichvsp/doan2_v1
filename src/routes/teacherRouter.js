const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const middleware = require('../middleware/authVerify');

// Trang dashboard 
router.get('/dashboard', middleware.isTeacher, teacherController.dashboardTeacherController.showDashboard);

// API Dashboard
router.get('/api/dashboard/quickstats', middleware.isTeacher, teacherController.dashboardTeacherController.getQuickStats);
router.get('/api/dashboard/todayschedules', middleware.isTeacher, teacherController.dashboardTeacherController.getTodaySchedules);
router.get('/api/dashboard/notifications', middleware.isTeacher, teacherController.dashboardTeacherController.getNotifications);
router.get('/api/dashboard/teachingclasses', middleware.isTeacher, teacherController.dashboardTeacherController.getTeachingClasses);
router.get('/api/dashboard/attendanceissues', middleware.isTeacher, teacherController.dashboardTeacherController.getAttendanceIssues);
router.get('/api/dashboard/upcomingschedules', middleware.isTeacher, teacherController.dashboardTeacherController.getUpcomingSchedules);

// // API điểm danh
// router.post('/api/attendance/start', middleware.isTeacher, teacherController.attendanceController.startAttendanceSession);
// router.get('/attendance/session/:id', middleware.isTeacher, teacherController.attendanceController.showAttendanceSession);
// router.post('/api/attendance/manual', middleware.isTeacher, teacherController.attendanceController.manualAttendance);
// router.post('/api/attendance/complete', middleware.isTeacher, teacherController.attendanceController.completeAttendanceSession);
// router.post('/api/attendance/cancel', middleware.isTeacher, teacherController.attendanceController.cancelAttendanceSession);
// router.get('/api/attendance/session/:id/records', middleware.isTeacher, teacherController.attendanceController.getAttendanceRecords);

// // Trang lớp học phần
// router.get('/classSession/:id', middleware.isTeacher, teacherController.classSessionController.showClassSessionDetail);
// router.get('/api/classSession/:id/students', middleware.isTeacher, teacherController.classSessionController.getStudents);
// router.get('/api/classSession/:id/attendances', middleware.isTeacher, teacherController.classSessionController.getAttendances);
// router.get('/api/classSession/:id/schedules', middleware.isTeacher, teacherController.classSessionController.getSchedules);
// router.get('/api/classSession/:id/stats', middleware.isTeacher, teacherController.classSessionController.getStats);

// // API báo cáo chuyên cần
// router.get('/api/reports/attendance/:classSessionId', middleware.isTeacher, teacherController.reportController.getAttendanceReport);
// router.post('/api/reports/export/attendance', middleware.isTeacher, teacherController.reportController.exportAttendanceReport);

// Thêm các routes liên quan đến lịch dạy

// Trang lịch dạy
router.get('/schedule', middleware.isTeacher, teacherController.scheduleTeacherController.showSchedulePage);

// API lịch dạy
router.get('/api/schedule', middleware.isTeacher, teacherController.scheduleTeacherController.getSchedulesByRange);
router.get('/api/schedule/subjects', middleware.isTeacher, teacherController.scheduleTeacherController.getTeacherSubjects);
router.get('/api/schedule/classsessions', middleware.isTeacher, teacherController.scheduleTeacherController.getTeacherClassSessions);
router.get('/api/schedule/rooms', middleware.isTeacher, teacherController.scheduleTeacherController.getTeacherRooms);

module.exports = router;