const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userManagementController = require('../controllers/adminController/userManagementController');
const subjectManagementController = require('../controllers/adminController/subjectManagementController');
const classroomManagementController = require('../controllers/adminController/classroomManagementController');
const departmentManagementController = require('../controllers/adminController/departmentManagementController');
const semesterManagementController = require('../controllers/adminController/semesterManagementController');
const timeManagementController = require('../controllers/adminController/timeManagementController');
const classsessionManagementController = require('../controllers/adminController/classsessionManagementController');
const middleware = require('../middleware/authVerify');

// Dashboard
router.get('/dashboard', middleware.isAdmin, adminController.dashboardController.getDashboard);

// Dashboard API routes
router.get('/api/dashboard/stats',middleware.isAdmin, adminController.dashboardManagementController.getStats);
router.get('/api/dashboard/attendance',middleware.isAdmin, adminController.dashboardManagementController.getAttendanceData);
router.get('/api/dashboard/classtype',middleware.isAdmin, adminController.dashboardManagementController.getClassTypeData);
router.get('/api/dashboard/currentsessions',middleware.isAdmin, adminController.dashboardManagementController.getCurrentSessions);
router.get('/api/dashboard/devices',middleware.isAdmin, adminController.dashboardManagementController.getDeviceStatus);
router.get('/api/dashboard/activities',middleware.isAdmin, adminController.dashboardManagementController.getRecentActivities);

// Quản lý người dùng - Giao diện
router.get('/userManagement', middleware.isAdmin, userManagementController.showUserManagement);

// API quản lý người dùng
// Lấy danh sách người dùng/nhóm người dùng
router.get('/api/users', middleware.isAdmin, userManagementController.getAllUsers);
router.get('/api/users/:id', middleware.isAdmin, userManagementController.getUserById);
router.get('/api/users/role/:roleId', middleware.isAdmin, userManagementController.getUsersByRole);
router.get('/api/users/department/:departmentId', middleware.isAdmin, userManagementController.getUsersByDepartment);

// Thêm, sửa, xóa người dùng
router.post('/api/users', middleware.isAdmin, userManagementController.createUser);
router.put('/api/users/:id', middleware.isAdmin, userManagementController.updateUser);
router.delete('/api/users/:id', middleware.isAdmin, userManagementController.deleteUser);

// API lấy danh sách vai trò và phòng ban
router.get('/api/roles', middleware.isAdmin, userManagementController.getAllRoles);
router.get('/api/departments', middleware.isAdmin, userManagementController.getAllDepartments);

// Quản lý môn học - Giao diện
router.get('/subjectManagement', middleware.isAdmin, subjectManagementController.showSubjectManagement);

// API quản lý môn học
router.get('/api/subjects', middleware.isAdmin, subjectManagementController.getAllSubjects);
router.get('/api/subjects/:id', middleware.isAdmin, subjectManagementController.getSubjectById);
router.post('/api/subjects', middleware.isAdmin, subjectManagementController.createSubject);
router.put('/api/subjects/:id', middleware.isAdmin, subjectManagementController.updateSubject);
router.delete('/api/subjects/:id', middleware.isAdmin, subjectManagementController.deleteSubject);
router.get('/api/subjects/check-duplicate', middleware.isAdmin, subjectManagementController.checkDuplicateSubject);

// Quản lý lớp học - Giao diện
router.get('/classroomManagement', middleware.isAdmin, classroomManagementController.showClassroomManagement);

// API quản lý lớp học
router.get('/api/classrooms', middleware.isAdmin, classroomManagementController.getAllClassrooms);
router.get('/api/classrooms/:id', middleware.isAdmin, classroomManagementController.getClassroomById);
router.post('/api/classrooms', middleware.isAdmin, classroomManagementController.createClassroom);
router.put('/api/classrooms/:id', middleware.isAdmin, classroomManagementController.updateClassroom);
router.delete('/api/classrooms/:id', middleware.isAdmin, classroomManagementController.deleteClassroom);
router.get('/api/classrooms/check-duplicate', middleware.isAdmin, classroomManagementController.checkDuplicateRoomCode);

// Quản lý khoa - Giao diện
router.get('/departmentManagement', middleware.isAdmin, departmentManagementController.showDepartmentManagement);

// API quản lý khoa
router.get('/api/departments/all', middleware.isAdmin, departmentManagementController.getAllDepartments);
router.get('/api/departments/:id', middleware.isAdmin, departmentManagementController.getDepartmentById);
router.get('/api/departments/:id/users', middleware.isAdmin, departmentManagementController.getUsersByDepartment);
router.post('/api/departments', middleware.isAdmin, departmentManagementController.createDepartment);
router.put('/api/departments/:id', middleware.isAdmin, departmentManagementController.updateDepartment);
router.delete('/api/departments/:id', middleware.isAdmin, departmentManagementController.deleteDepartment);
router.get('/api/departments/check-code', middleware.isAdmin, departmentManagementController.checkDuplicateDepartmentCode);
router.get('/api/departments/check-name', middleware.isAdmin, departmentManagementController.checkDuplicateDepartmentName);

// Quản lý học kỳ - Giao diện
router.get('/semesterManagement', middleware.isAdmin, semesterManagementController.showSemesterManagement);

// API quản lý học kỳ
router.get('/api/semesters', middleware.isAdmin, semesterManagementController.getAllSemesters);
router.get('/api/semesters/check-duplicate', middleware.isAdmin, semesterManagementController.checkDuplicateSemesterName);
router.get('/api/semesters/:id', middleware.isAdmin, semesterManagementController.getSemesterById);
router.get('/api/semesters/:id/class-sessions', middleware.isAdmin, semesterManagementController.getClassSessionsBySemester);
router.post('/api/semesters', middleware.isAdmin, semesterManagementController.createSemester);
router.put('/api/semesters/:id', middleware.isAdmin, semesterManagementController.updateSemester);
router.delete('/api/semesters/:id', middleware.isAdmin, semesterManagementController.deleteSemester);

// Thêm controller

// Quản lý thời gian tiết học - Giao diện
router.get('/timeManagement', middleware.isAdmin, timeManagementController.showTimeManagement);

// API quản lý thời gian tiết học
router.get('/api/times', middleware.isAdmin, timeManagementController.getAllTimes);
router.get('/api/times/:id', middleware.isAdmin, timeManagementController.getTimeById);
router.post('/api/times', middleware.isAdmin, timeManagementController.createTime);
router.put('/api/times/:id', middleware.isAdmin, timeManagementController.updateTime);
router.delete('/api/times/:id', middleware.isAdmin, timeManagementController.deleteTime);
router.get('/api/times/:id/schedules',middleware.isAdmin, adminController.timeManagementController.getSchedulesByTimeId);

// Quản lý học phần - Giao diện
router.get('/classsessionManagement', middleware.isAdmin, classsessionManagementController.showClassSessionManagement);

// API quản lý học phần
router.get('/api/classsessions', middleware.isAdmin, classsessionManagementController.getAllClassSessions);
router.get('/api/classsessions/check-code', middleware.isAdmin, classsessionManagementController.checkDuplicateClassCode);
router.get('/api/classsessions/:id', middleware.isAdmin, classsessionManagementController.getClassSessionById);
router.get('/api/classsessions/:id/students', middleware.isAdmin, classsessionManagementController.getEnrolledStudents);
router.get('/api/classsessions/:id/schedules', middleware.isAdmin, classsessionManagementController.getClassSessionSchedules);
router.post('/api/classsessions', middleware.isAdmin, classsessionManagementController.createClassSession);
router.put('/api/classsessions/:id', middleware.isAdmin, classsessionManagementController.updateClassSession);
router.delete('/api/classsessions/:id', middleware.isAdmin, classsessionManagementController.deleteClassSession);
router.get('/api/classsessions/check-schedule-conflict', middleware.isAdmin, adminController.classsessionManagementController.checkScheduleConflict);
router.post('/api/schedules', middleware.isAdmin, adminController.classsessionManagementController.createSchedule);
router.put('/api/schedules/:id', middleware.isAdmin, adminController.classsessionManagementController.updateSchedule);
router.delete('/api/schedules/:id', middleware.isAdmin, adminController.classsessionManagementController.deleteSchedule);
router.get('/api/classsessions/:id/export-students', middleware.isAdmin, adminController.classsessionManagementController.exportStudentList);

// RFID Management
router.get('/rfidmanagement',middleware.isAdmin, adminController.rfidManagementController.showRfidManagement);

// RFID API
router.get('/api/rfids', middleware.isAdmin, adminController.rfidManagementController.getAllRfids);
router.get('/api/rfids/:id', middleware.isAdmin, adminController.rfidManagementController.getRfidById);
router.get('/api/rfids-check-duplicate', middleware.isAdmin, adminController.rfidManagementController.checkDuplicateRfid);
router.post('/api/rfids', middleware.isAdmin, adminController.rfidManagementController.createRfid);
router.put('/api/rfids/:id', middleware.isAdmin, adminController.rfidManagementController.updateRfid);
router.delete('/api/rfids/:id', middleware.isAdmin, adminController.rfidManagementController.deleteRfid);
router.get('/api/available-rfids', middleware.isAdmin, adminController.rfidManagementController.getAvailableRfids);
router.get('/api/available-users', middleware.isAdmin, adminController.rfidManagementController.getAvailableUsers);

// RFID User API
router.get('/api/rfid-users', middleware.isAdmin, adminController.rfidManagementController.getAllRfidUsers);
router.post('/api/rfid-users', middleware.isAdmin, adminController.rfidManagementController.assignRfidToUser);
router.put('/api/rfid-users/:id/unassign',  middleware.isAdmin,adminController.rfidManagementController.unassignRfid);
router.put('/api/rfid-users/:id/reactivate', middleware.isAdmin, adminController.rfidManagementController.reactivateRfidUser);
router.put('/api/rfid-users/:id', middleware.isAdmin, adminController.rfidManagementController.updateRfidUser);
router.delete('/api/rfid-users/:id', middleware.isAdmin, adminController.rfidManagementController.deleteRfidUser);

// Device Management
router.get('/deviceManagement', middleware.isAdmin, adminController.deviceManagementController.showDeviceManagement);

// API device management
router.get('/api/devices', middleware.isAdmin, adminController.deviceManagementController.getAllDevices);
router.get('/api/devices/:id', middleware.isAdmin, adminController.deviceManagementController.getDeviceById);
router.get('/api/devices/check-duplicate', middleware.isAdmin, adminController.deviceManagementController.checkDuplicateDeviceCode);
router.post('/api/devices', middleware.isAdmin, adminController.deviceManagementController.createDevice);
router.put('/api/devices/:id', middleware.isAdmin, adminController.deviceManagementController.updateDevice);
router.delete('/api/devices/:id', middleware.isAdmin, adminController.deviceManagementController.deleteDevice);
router.get('/api/available-classes', middleware.isAdmin, adminController.deviceManagementController.getAvailableClasses);

// Quản lý đăng ký môn học - Giao diện
router.get('/enrollmentManagement', middleware.isAdmin, adminController.enrollmentManagementController.showEnrollmentManagement);

// API quản lý đăng ký môn học
router.get('/api/enrollments', middleware.isAdmin, adminController.enrollmentManagementController.getAllEnrollments);
router.get('/api/enrollments/:id', middleware.isAdmin, adminController.enrollmentManagementController.getEnrollmentById);
router.post('/api/enrollments', middleware.isAdmin, adminController.enrollmentManagementController.createEnrollment);
router.delete('/api/enrollments/:id', middleware.isAdmin, adminController.enrollmentManagementController.deleteEnrollment);

// API bổ sung cho đăng ký môn học
router.get('/api/class-sessions/:classSessionId/available-students', middleware.isAdmin, adminController.enrollmentManagementController.getAvailableStudentsForClassSession);
router.get('/api/class-sessions/:classSessionId/capacity', middleware.isAdmin, adminController.enrollmentManagementController.getClassSessionCapacity);
router.post('/api/bulk-enroll', middleware.isAdmin, adminController.enrollmentManagementController.bulkEnroll);

module.exports = router;