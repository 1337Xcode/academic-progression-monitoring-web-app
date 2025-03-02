const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const Student = require('./Student');
const Module = require('./Module');

const Enrollment = sequelize.define('Enrollment', {
    enrollment_id: {
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
    module_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Module,
            key: 'module_id'
        }
    },
    first_grade: {
        type: DataTypes.DECIMAL(5, 2)
    },
    grade_result: {
        type: DataTypes.STRING
    },
    resit_grade: {
        type: DataTypes.DECIMAL(5, 2)
    },
    resit_result: {
        type: DataTypes.STRING
    },
    attempt_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    tableName: 'enrollments',
    timestamps: false
});

module.exports = Enrollment;
