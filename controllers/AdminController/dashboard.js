const apiClient = require('../../utils/apiClient');
const { Programme, Student } = require('../../models');
const messageService = require('../../services/messageService');

// Show admin dashboard with counts of students, modules, and users
exports.dashboard = async (req, res) => {
    try {
        // Fetch counts via API calls
        const [studentData, moduleData, userData] = await Promise.all([
            apiClient.get('/students', { count: 'true' }),
            apiClient.get('/modules', { count: 'true' }),
            apiClient.get('/users', { count: 'true' })
        ]);

        // Fetch Programme count directly until API endpoint exists
        const totalProgrammes = await Programme.count();

        res.render('admin/dashboard', {
            totalStudents: studentData.count,
            totalModules: moduleData.count,
            staffUsers: userData.count, // Assuming API counts all users or admins
            totalProgrammes,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.status(err.status || 500).send(err.message || 'Error loading dashboard');
    }
};


// Handles sending a notification message from an admin.
exports.sendNotification = async (req, res) => {
    const { studentId, message } = req.body; // studentId is sId from form
    const senderId = req.session.userId;
    if (!message) return res.redirect('/admin/manageMessages');

    try {
        let validStudentDbId = null;
        if (studentId) {
            // Local lookup for sId -> student_id
            const student = await Student.findOne({ where: { sId: studentId } });
            if (!student) {
                 console.warn(`Admin tried to send message to non-existent student sId: ${studentId}`);
                 // Consider adding flash message here
                 return res.redirect('/admin/manageMessages');
            }
            validStudentDbId = student.student_id;
        }
        // Use the message service
        await messageService.sendNotification({ senderId, studentId: validStudentDbId, message });
        res.redirect('/admin/manageMessages');
    } catch (err) {
        console.error('Error sending notification:', err);
        res.status(500).send('Error sending notification: ' + err.message);
    }
};
