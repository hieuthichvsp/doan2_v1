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

// Thêm các routes liên quan đến lịch dạy
router.get('/schedule', middleware.isTeacher, teacherController.scheduleTeacherController.showSchedulePage);
router.get('/api/schedule', middleware.isTeacher, teacherController.scheduleTeacherController.getSchedulesByRange);
router.get('/api/schedule/subjects', middleware.isTeacher, teacherController.scheduleTeacherController.getTeacherSubjects);
router.get('/api/schedule/classsessions', middleware.isTeacher, teacherController.scheduleTeacherController.getTeacherClassSessions);
router.get('/api/schedule/rooms', middleware.isTeacher, teacherController.scheduleTeacherController.getTeacherRooms);
router.get('/api/semesters', middleware.isTeacher, teacherController.scheduleTeacherController.getSemesters);
router.get('/api/schedule/semesters', middleware.isTeacher, teacherController.scheduleTeacherController.getSemesters);

// Thêm các routes cho lớp học phần
router.get('/classSessionManagement', middleware.isTeacher, teacherController.classsessionTeacherController.showClassSessionPage);
router.get('/api/classsession', middleware.isTeacher, teacherController.classsessionTeacherController.getClassSessions);

// ĐẶT ROUTE CỐ ĐỊNH TRƯỚC CÁC ROUTE CÓ THAM SỐ
router.get('/api/classsession/exportAll', middleware.isTeacher, teacherController.classsessionTeacherController.exportClassSessions);

// SAU ĐÓ MỚI ĐẶT CÁC ROUTE CÓ THAM SỐ
router.get('/api/classsession/:id', middleware.isTeacher, teacherController.classsessionTeacherController.getClassSessionDetail);
router.get('/api/classsession/:id/students', middleware.isTeacher, teacherController.classsessionTeacherController.getStudents);
router.get('/api/classsession/:id/schedules', middleware.isTeacher, teacherController.classsessionTeacherController.getSchedules);
router.get('/api/classsession/:id/students/export', middleware.isTeacher, teacherController.classsessionTeacherController.exportStudents);
router.get('/api/classsession/:id/report/export', middleware.isTeacher, teacherController.classsessionTeacherController.exportClassSessionReport);

// Các routes khác
router.get('/api/semesters', middleware.isTeacher, teacherController.classsessionTeacherController.getSemesters);
router.get('/api/subjects', middleware.isTeacher, teacherController.classsessionTeacherController.getSubjects);

module.exports = router;