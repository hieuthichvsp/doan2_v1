'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Department extends Model {
        static associate(models) {
            Department.hasMany(models.User, { foreignKey: 'department_id', as: 'users' });
        }
    }
    Department.init({
        departcode: DataTypes.STRING(20),
        name: DataTypes.STRING(100)
    }, { sequelize, modelName: 'Department' });
    return Department;
};