const { Student, User, Programme, Notification } = require('../../models');
const { Op } = require('sequelize');
const messageService = require('../../services/messageService');
const progressionService = require('../../services/progressionService');

exports.dashboard = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { user_id: req.session.userId },
            include: [{ model: User }, { model: Programme }]
        });
        if (!student) return res.status(404).send('Student not found');

        // Use progression service to get detailed progression decision
        const progressionData = await progressionService.getProgressionDecision(student.student_id);

        // Get latest notifications (for dashboard card)
        const notifications = await require('../../services/messageService')
            .getNotifications({
                userId: req.session.userId,
                role: 'STUDENT',
                studentId: student.student_id
            });

        res.render('student/dashboard', {
            student,
            level1Stats: progressionData.level1Stats, // Pass Level 1 stats
            level2Stats: progressionData.level2Stats, // Pass Level 2 stats
            overallProgressionDecision: progressionData.decision, // Pass overall decision
            notifications,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error('Error loading student dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
};
