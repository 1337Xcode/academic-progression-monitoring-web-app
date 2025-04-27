const apiClient = require('../../utils/apiClient');
const messageService = require('../../services/messageService');
const progressionService = require('../../services/progressionService');

// Render the student dashboard
exports.dashboard = async (req, res) => {
    try {
        // Fetch student data via API using helper
        const student = await apiClient.getStudentDataByUserId(req.session.userId);

        // Use progression service to get progression decision
        const progressionData = await progressionService.getProgressionDecision(student.student_id);

        // Use message service to get notifications
        const notifications = await messageService.getNotifications({
            userId: req.session.userId,
            role: 'STUDENT',
            studentId: student.student_id
        });

        // Find the most recent admin-to-all-students notification
        const latestGlobalNotification = notifications.find(
            n => n.student_id === null && n.Sender && n.Sender.role === 'ADMIN'
        );

        // Render the dashboard with student data and notifications
        res.render('student/dashboard', {
            student,
            level1Stats: progressionData.level1Stats,
            level2Stats: progressionData.level2Stats,
            overallProgressionDecision: progressionData.decision,
            notifications,
            latestGlobalNotification,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error('Error loading student dashboard:', error);
        if (error.status === 404) return res.status(404).send('Student not found for this user.');
        res.status(error.status || 500).send(error.message || 'Error loading dashboard');
    }
};
