'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Device extends Model {
        static associate(models) {
            Device.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
        }
    }
    Device.init({
        device_code: {
            type: DataTypes.STRING(50),
            unique: true
        },
        name: DataTypes.STRING(100),
        location: DataTypes.STRING(255),
        class_id: DataTypes.INTEGER,
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, { sequelize, modelName: 'Device' });
    return Device;
};