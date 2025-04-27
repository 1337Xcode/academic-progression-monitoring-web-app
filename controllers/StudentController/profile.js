const apiClient = require('../../utils/apiClient');

// Fetch student profile data and render the profile page
exports.profile = async (req, res) => {
    try {
        // Use helper function from apiClient
        const student = await apiClient.getStudentDataByUserId(req.session.userId);
        res.render('student/profile', { student });
    } catch (error) {
        console.error('Error fetching student profile via API:', error);
        if (error.status === 404) return res.status(404).send('Student not found for this user.');
        res.status(error.status || 500).send(error.message || 'Error fetching student profile');
    }
};

// Update secondary email
exports.updateSecondaryEmail = async (req, res) => {
    const { secondary_email } = req.body;
    let studentId;
    try {
        studentId = await apiClient.getStudentIdByUserId(req.session.userId);
        await apiClient.put(`/students/${studentId}`, { secondary_email });
        res.redirect('/student/profile');
    } catch (error) {
        console.error('Error updating secondary email via API:', error);
        if (error.status === 409 && error.message.includes('email')) {
            try {
                // Re-fetch student data to render page with error
                const student = await apiClient.getStudentDataByUserId(req.session.userId);
                return res.render('student/profile', { student, emailError: error.message });
            } catch (fetchError) {
                 return res.status(500).send('Error updating secondary email and fetching profile.');
            }
        }
        res.status(error.status || 500).send(`Error updating secondary email: ${error.message}`);
    }
};

// Update profile image - File upload + API call
exports.updateProfileImage = async (req, res) => {
    if (!req.file) return res.redirect('/student/profile');
    try {
        const studentId = await apiClient.getStudentIdByUserId(req.session.userId);
        const imagePath = '/uploads/' + req.file.filename;

        await apiClient.put(`/students/${studentId}`, { profile_image: imagePath });
        res.redirect('/student/profile');
    } catch (error) {
        console.error('Error updating profile image via API:', error);
        res.status(error.status || 500).send(`Error updating profile image: ${error.message}`);
    }
};

// Update phone number
exports.updatePhone = async (req, res) => {
    const { phone } = req.body;
    let studentId;
    try {
        studentId = await apiClient.getStudentIdByUserId(req.session.userId);
        await apiClient.put(`/students/${studentId}`, { phone });
        res.redirect('/student/profile');
    } catch (error) {
        console.error('Error updating phone via API:', error);
         if (error.status === 409 && error.message.includes('phone')) {
            try {
                 // Re-fetch student data to render page with error
                 const student = await apiClient.getStudentDataByUserId(req.session.userId);
                 return res.render('student/profile', { student, phoneError: error.message });
            } catch (fetchError) {
                 return res.status(500).send('Error updating phone and fetching profile.');
            }
        }
        res.status(error.status || 500).send(`Error updating phone: ${error.message}`);
    }
};
