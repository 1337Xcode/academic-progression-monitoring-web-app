const { Student, User, Enrollment, Notification } = require('../../models');
const bcrypt = require('bcrypt'); // Ensure bcrypt is imported

// # Note: Do better documentation before submitting the final project

// Render the manageStudents page with pagination
exports.manageStudents = async (req, res) => { // Same stuff as the manageModules function
    const page = parseInt(req.query.page) || 1;
    const limit = 15; // Number of students per page
    const offset = (page - 1) * limit;

    try {
        const { count, rows: students } = await Student.findAndCountAll({
            include: [{ model: User, attributes: ['username', 'email'] }],
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit);

        res.render('admin/manageStudents/student', { students, totalPages, currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching students');
    }
};

// Add a new student
exports.addStudent = async (req, res) => {
    const { firstName, lastName, studentId, programmeId, entryLevel, acadYr, statusStudy } = req.body;
    try {
        const user = await User.create({
            username: `${firstName}${studentId.slice(-7)}`,
            email: `${firstName}${studentId.slice(-7)}@gmail.com`,
            password_hash: bcrypt.hashSync(`${firstName}${studentId.slice(-7)}`, 10),
            role: 'STUDENT'
        });
        await Student.create({
            user_id: user.user_id,
            sId: studentId,
            first_name: firstName,
            last_name: lastName,
            programme_id: programmeId,
            entry_level: entryLevel,
            acad_yr: acadYr,
            status_study: statusStudy
        });
        res.redirect('/admin/manageStudents');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding student');
    }
};

// Render the updateStudent page with specific student details
exports.renderUpdateStudent = async (req, res) => {
    const { studentId } = req.query;
    try {
        const student = await Student.findOne({
            where: { student_id: studentId },
            include: [{ model: User, attributes: ['username', 'email'] }]
        });
        if (student) {
            res.render('admin/manageStudents/updateStudent', { student });
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching student details');
    }
};

// Update an existing student
exports.updateStudent = async (req, res) => {
    const { studentId, firstName, lastName, programmeId, entryLevel, acadYr, statusStudy } = req.body;
    try {
        const student = await Student.findOne({ where: { student_id: studentId } });
        if (student) {
            await student.update({
                first_name: firstName || student.first_name,
                last_name: lastName || student.last_name,
                programme_id: programmeId || student.programme_id,
                entry_level: entryLevel || student.entry_level,
                acad_yr: acadYr || student.acad_yr,
                status_study: statusStudy || student.status_study
            });
            res.redirect('/admin/manageStudents');
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating student');
    }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
    const { studentId } = req.body;
    console.log(`Deleting student with ID: ${studentId}`);
    try {
        const student = await Student.findOne({ 
            where: { student_id: studentId },
            include: [{ model: User }]
        });

        if (student) {
            // Get the user_id associated with this student
            const userId = student.user_id;

            // Delete notifications where student is the recipient
            await Notification.destroy({ where: { student_id: studentId } });
            
            // Delete notifications sent by this student (using the user_id)
            if (userId) {
                await Notification.destroy({ where: { sender_id: userId } });
            }
            
            // Delete related enrollments
            await Enrollment.destroy({ where: { student_id: studentId } });
            
            // Delete the student
            await student.destroy();

            // Delete the user account if it exists
            if (userId) {
                await User.destroy({ where: { user_id: userId } });
            }

            res.redirect('/admin/manageStudents');
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).send('Error deleting student');
    }
};
