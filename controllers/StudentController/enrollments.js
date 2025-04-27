const apiClient = require('../../utils/apiClient');
const { Module, Student, User } = require('../../models'); // Import necessary models

// Render the enrollments page for a student
// Reference: https://stackoverflow.com
exports.list = async (req, res) => {
    try {
        // Get student data (including student_id) using API client
        const studentData = await apiClient.getStudentDataByUserId(req.session.userId);
        const studentId = studentData.student_id;

        // Fetch enrollments/grades for this student via API
        const apiEnrollments = await apiClient.get('/grades', { student_id: studentId });
        // Extract unique, non-null module IDs from the API response
        const moduleIds = [...new Set(apiEnrollments.map(e => e.module_id).filter(id => id != null))];
        let moduleMap = new Map(); // Initialize a map to store module details
        if (moduleIds.length > 0) {
            // Fetch the corresponding modules from the database
            const modules = await Module.findAll({
                where: {
                    module_id: moduleIds
                }
            });
            modules.forEach(m => moduleMap.set(m.module_id, m));
        }
        // Filter to only unique module code+catalog (latest attempt)
        const seen = new Set();
        const uniqueEnrollments = [];
        apiEnrollments
            .sort((a, b) => (b.attempt_count || 0) - (a.attempt_count || 0)) // Sort by attempt_count DESC
            .forEach(e => {
                // Get the full module details from our map using the module_id from the API response
                const fullModule = moduleMap.get(e.module_id);

                // Use the fullModule details if available
                if (fullModule && fullModule.subj_code && fullModule.subj_catalog) {
                    const code = fullModule.subj_code + fullModule.subj_catalog;
                    if (!seen.has(code)) {
                        seen.add(code);
                        // Replace the potentially incomplete Module object from API with the full one from DB
                        e.Module = fullModule.get({ plain: true }); // Use plain object
                        uniqueEnrollments.push(e);
                    }
                } else {
                    console.warn(`Enrollment ID ${e.enrollment_id || 'N/A'} is missing.`);
                }
            });

        res.render('student/enrollments', {
            student: studentData, // Pass student data obtained from API
            enrollments: uniqueEnrollments,
            csrfToken: req.csrfToken() // Pass CSRF token if needed
        });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        // Render an error page
        res.status(error.status || 500).render('error', {
            message: 'Could not retrieve your enrollments at this time.',
            error: process.env.NODE_ENV !== 'production' ? error : {}
        });
    }
};
