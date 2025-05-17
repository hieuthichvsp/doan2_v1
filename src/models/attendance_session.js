'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class AttendanceSession extends Model {
        static associate(models) {
            AttendanceSession.belongsTo(models.ClassSession, { foreignKey: 'class_session_id', as: 'classSession' });
            AttendanceSession.belongsTo(models.Schedule, { foreignKey: 'schedule_id', as: 'schedule' });
            AttendanceSession.hasMany(models.Attendance, { foreignKey: 'attendance_session_id', as: 'attendances' });
        }
    }
    AttendanceSession.init({
        class_session_id: DataTypes.INTEGER,
        schedule_id: DataTypes.INTEGER,
        date: DataTypes.DATE,
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME
    }, { sequelize, modelName: 'AttendanceSession' });
    return AttendanceSession;
};