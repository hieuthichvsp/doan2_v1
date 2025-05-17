'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ClassSession extends Model {
        static associate(models) {
            ClassSession.belongsTo(models.Subject, { foreignKey: 'sub_id', as: 'subject' });
            ClassSession.belongsTo(models.Semester, { foreignKey: 'semester_id', as: 'semester' });
            ClassSession.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
            ClassSession.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
            ClassSession.hasMany(models.Schedule, { foreignKey: 'id_class_session', as: 'schedules' });
            ClassSession.hasMany(models.Enrollment, { foreignKey: 'id_classsession', as: 'enrollments' });
            ClassSession.hasMany(models.AttendanceSession, { foreignKey: 'class_session_id', as: 'attendanceSessions' });
        }
    }
    ClassSession.init({
        class_code: DataTypes.STRING(20),
        name: DataTypes.STRING(100),
        type: DataTypes.ENUM('LT', 'TH'),
        sub_id: DataTypes.INTEGER,
        semester_id: DataTypes.INTEGER,
        class_id: DataTypes.INTEGER,
        capacity: DataTypes.INTEGER,
        teacher_id: DataTypes.INTEGER,
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME
    }, { sequelize, modelName: 'ClassSession' });
    return ClassSession;
};