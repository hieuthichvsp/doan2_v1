'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Subject extends Model {
        static associate(models) {
            Subject.hasMany(models.ClassSession, { foreignKey: 'sub_id', as: 'classSessions' });
        }
    }
    Subject.init({
        sub_code: DataTypes.STRING(20),
        name: DataTypes.STRING(100),
        credit: DataTypes.INTEGER
    }, { sequelize, modelName: 'Subject' });
    return Subject;
};