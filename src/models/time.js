'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Time extends Model {
        static associate(models) {
            Time.hasMany(models.Schedule, { foreignKey: 'id_time', as: 'schedules' });
        }
    }
    Time.init({
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME,
        type: DataTypes.ENUM('LT', 'TH')
    }, { sequelize, modelName: 'Time' });
    return Time;
};