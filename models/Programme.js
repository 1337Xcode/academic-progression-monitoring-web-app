const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const Programme = sequelize.define('Programme', {
    programme_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    programme_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    programme_name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'programmes',
    timestamps: false
});

module.exports = Programme;
