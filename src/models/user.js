'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
            User.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            User.hasMany(models.ClassSession, { foreignKey: 'teacher_id', as: 'teachingSessions' });
            User.hasMany(models.Enrollment, { foreignKey: 'id_student', as: 'enrollments' });
            User.hasMany(models.RfidUser, { foreignKey: 'student_id', as: 'rfidCards' });
            User.hasMany(models.Attendance, { foreignKey: 'student_id', as: 'attendances' });
        }
    }
    User.init({
        user_code: DataTypes.STRING(50),
        name: DataTypes.STRING(100),
        password: DataTypes.STRING(255),
        email: DataTypes.STRING(100),
        birthday: DataTypes.DATE,
        address: DataTypes.STRING(255),
        role_id: DataTypes.INTEGER,
        department_id: DataTypes.INTEGER
    }, { sequelize, modelName: 'User' });
    return User;
};