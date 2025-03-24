const { Notification, User, Student } = require('../models');
const { Op } = require('sequelize');

/**
 * Send a notification from one user to another (or all students)
 */
exports.sendNotification = async ({ senderId, studentId = null, message }) => {
    // Ensure student_id is numeric or null
    const numericStudentId = studentId ? parseInt(studentId, 10) : null;
    
    // Create the notification
    return await Notification.create({
        sender_id: senderId,
        student_id: numericStudentId,
        message,
        sent_at: new Date(),
        is_read: false
    });
};

/**
 * Get notifications for a user
 */
exports.getNotifications = async ({ userId, role, studentId = null }) => {
    if (role === 'ADMIN') {
        // For admin, get all messages
        return await Notification.findAll({
            include: [{
                model: User,
                as: 'Sender',
                include: [{ model: Student }]
            }],
            order: [['sent_at', 'DESC']]
        });
    } else {
        // For students, get messages sent by them and messages addressed to them or all students
        return await Notification.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userId },
                    { 
                        [Op.and]: [
                            { student_id: studentId },
                            { sender_id: { [Op.ne]: userId } }
                        ]
                    },
                    { 
                        [Op.and]: [
                            { student_id: null }, // Messages to all students
                            { sender_id: { [Op.ne]: userId } }
                        ]
                    }
                ]
            },
            include: [{
                model: User,
                as: 'Sender'
            }],
            order: [['sent_at', 'DESC']]
        });
    }
};
