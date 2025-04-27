const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const Student = require('./Student');

const StudentMitigation = sequelize.define('StudentMitigation', {
    mitigation_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Student,
            key: 'student_id'
        }
    },
    mitigation_type: {
        type: DataTypes.ENUM('MANUAL_DECISION', 'WAIVE_CORE_MODULE', 'IGNORE_MODULE_FAILURE'),
        allowNull: false
    },
    applied_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'student_mitigations',
    timestamps: false // Assuming 'applied_at' handles the timestamp logic
});

module.exports = StudentMitigation;
