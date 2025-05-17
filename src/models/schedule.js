'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Schedule extends Model {
        static associate(models) {
            Schedule.belongsTo(models.Time, { foreignKey: 'id_time', as: 'time' });
            Schedule.belongsTo(models.ClassSession, { foreignKey: 'id_class_session', as: 'classSession' });
            Schedule.hasMany(models.AttendanceSession, { foreignKey: 'schedule_id', as: 'attendanceSessions' });
        }
    }
    Schedule.init({
        weekday: DataTypes.TINYINT,
        id_time: DataTypes.INTEGER,
        id_class_session: DataTypes.INTEGER
    }, { sequelize, modelName: 'Schedule' });
    return Schedule;
};