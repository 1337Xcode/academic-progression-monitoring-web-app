const { Student, User } = require('../models');

exports.profile = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { user_id: req.session.userId },
            include: [User]
        });

        if (!student) {
            return res.status(404).send('Student not found');
        }

        res.render('student/profile', { student });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).send('Error fetching student profile');
    }
};

// Update student profile
exports.updateProfile = async (req, res) => {
    const { firstName, lastName, email } = req.body;
    try {
        const student = await Student.findOne({ where: { student_id: req.session.userId } });
        if (student) {
            await student.update({
                first_name: firstName,
                last_name: lastName,
                email: email
            });
            res.redirect('/student/profile');
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).send('Error updating student profile');
    }
};
