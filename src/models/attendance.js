'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Attendance extends Model {
        static associate(models) {
            Attendance.belongsTo(models.AttendanceSession, { foreignKey: 'attendance_session_id', as: 'attendanceSession' });
            Attendance.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
        }
    }
    Attendance.init({
        attendance_session_id: DataTypes.INTEGER,
        student_id: DataTypes.INTEGER,
        checkin_time: DataTypes.DATE,
        status: {
            type: DataTypes.ENUM('Đúng giờ', 'Muộn', 'Vắng'),
            defaultValue: 'Vắng'
        }
    }, { sequelize, modelName: 'Attendance' });
    return Attendance;
};