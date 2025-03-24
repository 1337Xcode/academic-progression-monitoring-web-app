const { Student, User, Programme } = require('../../models');

exports.profile = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { user_id: req.session.userId },
            include: [
                { model: User },
                { model: Programme }
            ]
        });
        if (!student) return res.status(404).send('Student not found');
        res.render('student/profile', { student });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).send('Error fetching student profile');
    }
};

exports.updateSecondaryEmail = async (req, res) => {
    const { secondary_email } = req.body;
    try {
        const student = await Student.findOne({ where: { user_id: req.session.userId }, include: [{ model: User }, { model: Programme }] });
        if (student) {
            await student.update({ secondary_email });
            res.redirect('/student/profile');
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        if (error.original && error.original.code === 'ER_DUP_ENTRY') {
            // Render profile page with error message
            const student = await Student.findOne({ where: { user_id: req.session.userId }, include: [{ model: User }, { model: Programme }] });
            res.render('student/profile', { student, emailError: 'This email is already in use. Please use a different email.' });
        } else {
            console.error('Error updating secondary email:', error);
            res.status(500).send('Error updating secondary email');
        }
    }
};

exports.updateProfileImage = async (req, res) => {
    if (!req.file) return res.redirect('/student/profile');
    try {
        const student = await Student.findOne({ where: { user_id: req.session.userId } });
        if (student) {
            const imagePath = '/uploads/' + req.file.filename;
            await student.update({ profile_image: imagePath });
            res.redirect('/student/profile');
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).send('Error updating profile image');
    }
};

exports.updatePhone = async (req, res) => {
    const { phone } = req.body;
    try {
        const student = await Student.findOne({ where: { user_id: req.session.userId }, include: [{ model: User }, { model: Programme }] });
        if (student) {
            await student.update({ phone });
            res.redirect('/student/profile');
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        if (error.original && error.original.code === 'ER_DUP_ENTRY') {
            // Render profile page with error message
            const student = await Student.findOne({ where: { user_id: req.session.userId }, include: [{ model: User }, { model: Programme }] });
            res.render('student/profile', { student, phoneError: 'This phone number is already in use. Please use a different number.' });
        } else {
            console.error('Error updating phone:', error);
            res.status(500).send('Error updating phone');
        }
    }
};
