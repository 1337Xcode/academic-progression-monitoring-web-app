const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const Student = require('./Student');
const User = require('./User');

const Notification = sequelize.define('Notification', {
    notification_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    sender_id: { // Admin user_id
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        }
    },
    student_id: { // Null means sent to all students
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Student,
            key: 'student_id'
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sent_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    timestamps: false
});

module.exports = Notification;
