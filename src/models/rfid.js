'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Rfid extends Model {
        static associate(models) {
            Rfid.hasMany(models.RfidUser, { foreignKey: 'rfid_id', as: 'rfidUsers' });
        }
    }
    Rfid.init({
        code: {
            type: DataTypes.STRING(50),
            unique: true
        }
    }, { sequelize, modelName: 'Rfid' });
    return Rfid;
};