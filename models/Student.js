const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const User = require('./User');

const Student = sequelize.define('Student', {
    student_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        }
    },
    sId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    programme_id: {
        type: DataTypes.INTEGER
    },
    entry_level: {
        type: DataTypes.STRING
    },
    acad_yr: {
        type: DataTypes.STRING
    },
    status_study: {
        type: DataTypes.STRING
    },
    // The following columns will be added once the migration script is run
    secondary_email: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    profile_image: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'students',
    timestamps: false
});

module.exports = Student;
