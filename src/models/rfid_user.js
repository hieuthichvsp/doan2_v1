'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RfidUser extends Model {
        static associate(models) {
            RfidUser.belongsTo(models.Rfid, { foreignKey: 'rfid_id', as: 'rfid' });
            RfidUser.belongsTo(models.User, { foreignKey: 'student_id', as: 'user' });
        }
    }
    RfidUser.init({
        rfid_id: DataTypes.INTEGER,
        student_id: DataTypes.INTEGER,
        status: DataTypes.BOOLEAN
    }, { sequelize, modelName: 'RfidUser' });
    return RfidUser;
};