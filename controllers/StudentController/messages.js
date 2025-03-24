const { Student } = require('../../models');
const msgSvc = require('../../services/messageService');

exports.messages = async (req, res) => {
    try {
        const student = await Student.findOne({ where: { user_id: req.session.userId } });
        if (!student) return res.status(404).send('Student not found');

        // Fetch both admin→student and student’s own messages
        const notifications = await msgSvc.getNotifications({
            userId: req.session.userId,
            role: 'STUDENT',
            studentId: student.student_id
        });

        res.render('student/messages', {
            notifications,
            csrfToken: req.csrfToken(),
            studentUserId: req.session.userId
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Error fetching messages');
    }
};

exports.contactAdvisor = async (req, res) => {
    const message = req.body.message;
    const senderId = req.session.userId;

    // Send student→admin message
    await msgSvc.sendNotification({ senderId, message });
    res.redirect('/student/messages');
};
