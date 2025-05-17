const dashboardController = require('../adminController/dashboardController');
const dashboardManagementController = require('./dashboardManagementController');
const userManagementController = require('./userManagementController');
const subjectManagementController = require('./subjectManagementController');
const classroomManagementController = require('./classroomManagementController');
const departmentManagementController = require('./departmentManagementController');
const semesterManagementController = require('./semesterManagementController');
const timeManagementController = require('./timeManagementController');
const classsessionManagementController = require('./classsessionManagementController');
const rfidManagementController = require('./rfidManagementController');
const deviceManagementController = require('./deviceManagementController');
const enrollmentManagementController = require('./enrollmentManagementController');

module.exports = {
    dashboardController,
    dashboardManagementController,
    userManagementController,
    subjectManagementController,
    classroomManagementController,
    rfidManagementController,
    departmentManagementController,
    semesterManagementController,
    timeManagementController,
    classsessionManagementController,
    deviceManagementController,
    enrollmentManagementController
};