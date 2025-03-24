const { Student, Programme } = require('../../models');
const progressionService = require('../../services/progressionService');

exports.progression = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { user_id: req.session.userId },
            include: [{ model: Programme }]
        });
        if (!student) return res.status(404).send('Student not found');

        // Get the detailed progression decision from the service
        const progressionData = await progressionService.getProgressionDecision(student.student_id);

        res.render('student/progression', {
            student,
            level1Stats: progressionData.level1Stats, // Pass Level 1 stats
            level2Stats: progressionData.level2Stats, // Pass Level 2 stats
            overallProgressionDecision: progressionData.decision, // Pass overall decision
            csrfToken: req.csrfToken() // Pass CSRF token if needed by partials
        });
    } catch (error) {
        console.error('Error fetching progression:', error);
        res.status(500).send('Error fetching progression');
    }
};
