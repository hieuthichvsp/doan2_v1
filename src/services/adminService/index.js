const userService = require('./userService');
const dashboardService = require('./dashboardService');
const roleService = require('./roleService');
const departmentService = require('./departmentService');
const subjectService = require('./subjectService');
const classroomService = require('./classroomService');
const semesterService = require('./semesterService');
const timeService = require('./timeService');
const classsessionService = require('./classsessionService');
const rfidService = require('./rfidService');
const rfidUserService = require('./rfiduserService');
const deviceService = require('./deviceService');
const scheduleService = require('./scheduleService');
const enrollmentService = require('./enrollmentService');


module.exports = {
    userService,
    dashboardService,
    roleService,
    departmentService,
    subjectService,
    classroomService,
    semesterService,
    timeService,
    classsessionService,
    rfidService,
    rfidUserService,
    deviceService,
    scheduleService,
    enrollmentService
};