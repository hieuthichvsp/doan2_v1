'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Semester extends Model {
        static associate(models) {
            Semester.hasMany(models.ClassSession, { foreignKey: 'semester_id', as: 'classSessions' });
        }
    }
    Semester.init({
        name: DataTypes.STRING(50),
        start_time: DataTypes.DATE,
        end_time: DataTypes.DATE
    }, { sequelize, modelName: 'Semester' });
    return Semester;
};