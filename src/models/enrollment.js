'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Enrollment extends Model {
        static associate(models) {
            Enrollment.belongsTo(models.ClassSession, { foreignKey: 'id_classsession', as: 'classSession' });
            Enrollment.belongsTo(models.User, { foreignKey: 'id_student', as: 'student' });
        }
    }
    Enrollment.init({
        id_classsession: DataTypes.INTEGER,
        id_student: DataTypes.INTEGER
    }, { sequelize, modelName: 'Enrollment' });
    return Enrollment;
};