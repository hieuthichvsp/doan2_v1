'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Class extends Model {
        static associate(models) {
            Class.hasMany(models.ClassSession, { foreignKey: 'class_id', as: 'classSessions' });
            Class.hasMany(models.Device, { foreignKey: 'class_id', as: 'devices' });
        }
    }
    Class.init({
        room_code: DataTypes.STRING(20),
        name: DataTypes.STRING(100),
        capacity: DataTypes.INTEGER,
        type: DataTypes.ENUM('LT', 'TH')
    }, { sequelize, modelName: 'Class' });
    return Class;
};