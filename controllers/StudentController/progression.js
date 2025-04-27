const apiClient = require('../../utils/apiClient');
const progressionService = require('../../services/progressionService');

// Fetch student progression data and render the progression page
exports.progression = async (req, res) => {
    try {
        // Fetch student data via API using helper
        const student = await apiClient.getStudentDataByUserId(req.session.userId);

        // Get the detailed progression decision from the service
        const progressionData = await progressionService.getProgressionDecision(student.student_id);

        res.render('student/progression', {
            student,
            level1Stats: progressionData.level1Stats,
            level2Stats: progressionData.level2Stats,
            overallProgressionDecision: progressionData.decision,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error('Error fetching progression:', error);
        if (error.status === 404) return res.status(404).send('Student not found for this user.');
        res.status(error.status || 500).send(error.message || 'Error fetching progression');
    }
};
