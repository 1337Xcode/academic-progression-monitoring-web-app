const apiClient = require('../../utils/apiClient');

// Render the manageStudents page with pagination
exports.manageStudents = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;

    try {
        const data = await apiClient.get('/students', { page, limit });
        res.render('admin/manageStudents/student', {
            students: data.students,
            totalPages: data.totalPages,
            currentPage: data.currentPage
        });
    } catch (error) {
        console.error('Error fetching students via API:', error);
        res.status(error.status || 500).send(error.message || 'Error fetching students');
    }
};

// Add a new student
exports.addStudent = async (req, res) => {
    const { firstName, lastName, studentId, programmeId, entryLevel, acadYr, statusStudy } = req.body;
    let createdUserId;

    try {
        // Step 1: Create the User via API
        const userPassword = `${firstName}${studentId.slice(-7)}`;
        const userPayload = {
            username: `${firstName}${studentId.slice(-7)}`, // Slice to get last 7 digits of studentId
            email: `${firstName}${studentId.slice(-7)}@gmail.com`, // email...
            password: userPassword, // API handles hashing
            role: 'STUDENT'
        };
        const newUser = await apiClient.post('/users', userPayload);
        createdUserId = newUser.user_id;

        // Step 2: Create the Student payload
        const studentPayload = {
            user_id: createdUserId,
            sId: studentId,
            first_name: firstName,
            last_name: lastName,
            programme_id: programmeId,
            entry_level: entryLevel,
            acad_yr: acadYr,
            status_study: statusStudy
        };
        await apiClient.post('/students', studentPayload);

        res.redirect('/admin/manageStudents');
    } catch (error) {
        console.error('Error adding student via API:', error);
        // Attempt to clean up the created user if student creation failed
        if (createdUserId) {
            try {
                await apiClient.del(`/users/${createdUserId}`);
                console.log(`Cleaned up user ${createdUserId} after student creation failure.`);
            } catch (cleanupError) {
                console.error(`Failed to cleanup user ${createdUserId}:`, cleanupError);
            }
        }
        res.status(error.status || 500).send(`Error adding student: ${error.message}`);
    }
};

// Render the updateStudent page with specific student details
exports.renderUpdateStudent = async (req, res) => {
    const { studentId } = req.query; // PK
    try {
        const student = await apiClient.get(`/students/${studentId}`);
        res.render('admin/manageStudents/updateStudent', { student });
    } catch (error) {
        console.error('Error fetching student details via API:', error);
        if (error.status === 404) return res.status(404).send('Student not found');
        res.status(error.status || 500).send(error.message || 'Error fetching student details');
    }
};

// Update an existing student via API
exports.updateStudent = async (req, res) => {
    const { studentId, firstName, lastName, programmeId, entryLevel, acadYr, statusStudy } = req.body; // studentId is PK
    try {
        const payload = {
            first_name: firstName,
            last_name: lastName,
            programme_id: programmeId,
            entry_level: entryLevel,
            acad_yr: acadYr,
            status_study: statusStudy
        };
        // Remove undefined fields to avoid overwriting with null
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        await apiClient.put(`/students/${studentId}`, payload);
        res.redirect('/admin/manageStudents');
    } catch (error) {
        console.error('Error updating student via API:', error);
        res.status(error.status || 500).send(`Error updating student: ${error.message}`);
    }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
    const { studentId } = req.body; // PK
    try {
        await apiClient.del(`/students/${studentId}`); // API handles deleting related user, notifications, enrollments
        res.redirect('/admin/manageStudents');
    } catch (error) {
        console.error('Error deleting student via API:', error);
        res.status(error.status || 500).send(`Error deleting student: ${error.message}`);
    }
};
