const apiClient = require('../../utils/apiClient');
const msgSvc = require('../../services/messageService');

// Render the messages page for a student
exports.messages = async (req, res) => {
    try {
        // Get student_id via API using helper
        const studentId = await apiClient.getStudentIdByUserId(req.session.userId);

        // Fetch notifications using the message service
        const notifications = await msgSvc.getNotifications({
            userId: req.session.userId,
            role: 'STUDENT',
            studentId: studentId
        });

        res.render('student/messages', {
            notifications,
            csrfToken: req.csrfToken(),
            studentUserId: req.session.userId
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        if (error.status === 404) return res.status(404).send('Student not found for this user.');
        res.status(error.status || 500).send(error.message || 'Error fetching messages');
    }
};

// contact an advisor (admin) via the message service
exports.contactAdvisor = async (req, res) => {
    const message = req.body.message;
    const senderId = req.session.userId; // User ID of the student sending

    try {
        // Send student→admin message via service
        await msgSvc.sendNotification({ senderId, message }); // Service determines recipient (admin)
        res.redirect('/student/messages');
    } catch (error) {
         console.error('Error sending message to advisor:', error);
         res.status(500).send('Error sending message');
    }
};
