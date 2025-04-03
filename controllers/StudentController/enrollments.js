const { Student, Enrollment, Module, Programme } = require('../../models');

exports.list = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { user_id: req.session.userId },
            include: [{ model: Programme }]
        });
        if (!student) return res.status(404).send('Student not found');

        const enrollments = await Enrollment.findAll({
            where: { student_id: student.student_id },
            include: [{ model: Module }]
        });

        // Filter to only unique module code+catalog (latest attempt)
        const seen = new Set();
        const uniqueEnrollments = [];
        enrollments
            .sort((a, b) => (b.attempt_count || 1) - (a.attempt_count || 1)) // Descending by attempt
            .forEach(e => {
                const code = e.Module.subj_code + e.Module.subj_catalog;
                if (!seen.has(code)) {
                    seen.add(code);
                    uniqueEnrollments.push(e);
                }
            });

        res.render('student/enrollments', {
            student,
            enrollments: uniqueEnrollments
        });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).send('Error fetching enrollments');
    }
};
