const { Student, Module, User, Programme } = require('../../models'); // Removed Enrollment and messageService as they are no longer needed

exports.dashboard = async (req, res) => {
    try {
        // Get stats used in the dashboard view
        const totalStudents = await Student.count();
        const totalModules = await Module.count();
        const staffUsers = await User.count({ where: { role: 'ADMIN' } });

        // Additional stats
        const totalProgrammes = await Programme.count();

        res.render('admin/dashboard', {
            totalStudents,
            totalModules,
            staffUsers,
            totalProgrammes, // New stat
            csrfToken: req.csrfToken() // Keep csrfToken if needed by partials or future forms
        });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.status(500).send('Error loading dashboard');
    }
};

exports.sendNotification = async (req, res) => {
    const { studentId, message } = req.body;
    const senderId = req.session.userId;
    if (!message) return res.redirect('/admin/dashboard');

    try {
        let validStudentId = null;
        if (studentId) {
            // Look up student by sId (which is a string like '22-IFSY-0933003')
            const student = await Student.findOne({ where: { sId: studentId } });
            if (!student) return res.redirect('/admin/manageMessages');
            // Use the numeric student_id for the database relation
            validStudentId = student.student_id;
        }
        await require('../../services/messageService')
            .sendNotification({ senderId, studentId: validStudentId, message });
        res.redirect('/admin/manageMessages');
    } catch (err) {
        console.error('Error sending notification:', err);
        res.status(500).send('Error sending notification: ' + err.message);
    }
};
