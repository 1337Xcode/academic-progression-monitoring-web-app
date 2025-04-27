const apiClient = require('../../utils/apiClient');
const progressionService = require('../../services/progressionService');
const { Student, Programme, ProgressionRule, StudentMitigation } = require('../../models');

/*
* Progression Management
* This section handles the rendering and processing of progression decisions for students.
*/

// Render the manageProgression page
exports.manageProgression = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;

    try {
        const studentData = await apiClient.get('/students', { page, limit });
        const progressionSummaries = [];

        // Fetch progression decisions for each student
        if (studentData.students && studentData.students.length > 0) {
            for (const student of studentData.students) {
                const progression = await progressionService.getProgressionDecision(student.student_id);
                // Check average percentage for level 1 and level 2
                const level1Avg = typeof progression.level1Stats.averagePercentage === 'number' ? progression.level1Stats.averagePercentage : null;
                const level2Avg = typeof progression.level2Stats.averagePercentage === 'number' ? progression.level2Stats.averagePercentage : null;
                // Push the student data into the progressionSummaries array
                progressionSummaries.push({
                    sId: student.sId,
                    name: `${student.first_name} ${student.last_name}`,
                    programmeCode: student.programme_code || (student.Programme ? student.Programme.programme_code : 'N/A'),
                    decision: progression.decision,
                    level1Avg: level1Avg,
                    level2Avg: level2Avg
                });
            }
        }
        // Render the manageProgression page with the fetched data
        res.render('admin/manageProgression/progression', {
            students: progressionSummaries,
            totalPages: studentData.totalPages,
            currentPage: studentData.currentPage,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error('Error fetching progression data for admin:', error);
        res.status(error.status || 500).render('error', {
            title: 'Server Error',
            message: 'Error fetching progression data. Please try again later.'
        });
    }
};

// Render the viewStudentProgression page with specific student data
exports.viewStudentProgression = async (req, res) => {
    const sId = req.params.sId;
    try {
        const student = await Student.findOne({
            where: { sId },
            include: [Programme]
        });

        if (!student) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: `Student with ID ${sId} not found.`
            });
        }

        const progressionData = await progressionService.getProgressionDecision(student.student_id);

        res.render('admin/manageProgression/viewStudent', {
            student,
            progressionData,
            csrfToken: req.csrfToken()
        });

    } catch (error) {
        console.error(`Error fetching progression data for student ${sId}:`, error);
        res.status(500).render('error', {
            title: 'Server Error',
            message: `Error fetching progression data for student ${sId}. Please try again later.`
        });
    }
};

// Render the editProgression page with a list of progression rules
exports.renderEditProgression = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await ProgressionRule.findAndCountAll({
            limit,
            offset,
            order: [['programme_code', 'ASC']]
        });

        const success = req.query.success || '';

        res.render('admin/manageProgression/editProgression', {
            rules: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            csrfToken: req.csrfToken(),
            success,
            error: ''
        });
    } catch (error) {
        console.error('Error fetching progression rules:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Failed to load progression rules. Please try again later.'
        });
    }
};

/*
* Progression Rule Management
* This section handles the addition, update, and deletion of progression rules.
*/

// Add a new progression rule
exports.addProgressionRule = async (req, res) => {
    const { programme_code, min_pass_mark, min_avg_grade, total_credits_required, compulsory_modules } = req.body;
    let successMsg = '';
    try {
        if (!programme_code || !min_pass_mark || !min_avg_grade || !total_credits_required) {
            return res.status(400).render('error', {
                title: 'Bad Request',
                message: 'Missing required fields for new progression rule.'
            });
        }

        const ruleExists = await ProgressionRule.findOne({ where: { programme_code } });
        if (ruleExists) {
            return res.status(409).render('error', {
                title: 'Conflict',
                message: `Progression rule for programme code '${programme_code}' already exists.`
            });
        }

        await ProgressionRule.create({
            programme_code,
            min_pass_mark: parseFloat(min_pass_mark),
            min_avg_grade: parseFloat(min_avg_grade),
            total_credits_required: parseInt(total_credits_required),
            compulsory_modules: compulsory_modules || null
        });
        successMsg = `Progression rule for ${programme_code} added successfully.`;
        res.redirect(`/admin/manageProgression/edit?success=${encodeURIComponent(successMsg)}`); // encodeURIComponent to handle spaces and special characters in the success message
    } catch (error) {
        console.error('Error adding progression rule:', error);
        let errorTitle = 'Server Error';
        let errorMessage = 'Failed to add progression rule. Please try again later.';

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            errorTitle = 'Bad Request';
            errorMessage = `Failed to add rule: Programme code '${programme_code}' does not exist in the Programmes table.`;
            return res.status(400).render('error', { title: errorTitle, message: errorMessage });
        }
        res.status(500).render('error', { title: errorTitle, message: errorMessage });
    }
};

// Update an existing progression rule
exports.updateProgressionRule = async (req, res) => {
    const { rule_id, min_pass_mark, min_avg_grade, total_credits_required, compulsory_modules } = req.body;
    const page = req.query.page || 1;
    let successMsg = '';
    try {
        const rule = await ProgressionRule.findByPk(rule_id);
        if (!rule) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Progression rule not found.'
            });
        }

        if (!min_pass_mark || !min_avg_grade || !total_credits_required) {
            return res.status(400).render('error', {
                title: 'Bad Request',
                message: 'Missing required fields for updating the progression rule.'
            });
        }

        rule.min_pass_mark = parseFloat(min_pass_mark);
        rule.min_avg_grade = parseFloat(min_avg_grade);
        rule.total_credits_required = parseInt(total_credits_required);
        rule.compulsory_modules = compulsory_modules || null;

        await rule.save();
        successMsg = `Progression rule for ${rule.programme_code} updated successfully.`;
        res.redirect(`/admin/manageProgression/edit?page=${page}&success=${encodeURIComponent(successMsg)}`);
    } catch (error) {
        console.error('Error updating progression rule:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Failed to update progression rule. Please try again later.'
        });
    }
};

// Delete a progression rule based on the rule_id provided in the request body
exports.deleteProgressionRule = async (req, res) => {
    const { rule_id } = req.body;
    const page = req.query.page || 1;
    let successMsg = '';
    try {
        const rule = await ProgressionRule.findByPk(rule_id);
        if (!rule) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Progression rule not found.'
            });
        }

        const programmeCode = rule.programme_code;
        await rule.destroy();
        successMsg = `Progression rule for ${programmeCode} deleted successfully.`;
        res.redirect(`/admin/manageProgression/edit?page=${page}&success=${encodeURIComponent(successMsg)}`);
    } catch (error) {
        console.error('Error deleting progression rule:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Failed to delete progression rule. Please try again later.'
        });
    }
};

/*
* Mitigation Management
* This section handles the rendering and processing of mitigation requests for students.
*/

// Render the applyMitigation page with specific student data
exports.renderApplyMitigation = async (req, res) => {
    const sId = req.params.sId;
    const success = req.query.success || '';
    let student = null;

    try {
        // Check if sId is provided in the request parameters
        if (sId) {
            student = await Student.findOne({ where: { sId } });
            if (!student) { // If student not found, render error page
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: `Student with ID ${sId} not found.`
                });
            }
        }

        res.render('admin/manageProgression/applyMitigation', {
            student,
            csrfToken: req.csrfToken(),
            success,
            error: '',
            errors: {}
        });
    } catch (err) {
        console.error('Error rendering apply mitigation page:', err);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Error loading the apply mitigation page. Please try again later.'
        });
    }
};

// Apply mitigation to a student based on the provided sId and mitigation type
exports.applyMitigation = async (req, res) => {
    const { sId, mitigation_type, notes } = req.body;
    let student = null;
    const errors = {};

    try {
        // Validate input fields
        if (!sId) errors.sId = 'Student ID is required.';
        if (!mitigation_type) errors.mitigation_type = 'Mitigation type is required.';
        if (!['MANUAL_DECISION', 'WAIVE_CORE_MODULE', 'IGNORE_MODULE_FAILURE'].includes(mitigation_type)) { // Check if the selected mitigation type is valid
            errors.mitigation_type = 'Invalid mitigation type selected.';
        }

        if (Object.keys(errors).length > 0) { // Check if there are any validation errors
            return res.status(400).send('Invalid mitigation request.');
        }

        student = await Student.findOne({ where: { sId } });
        if (!student) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: `Student with ID ${sId} not found.`
            });
        }

        await StudentMitigation.create({ // Create a new mitigation record
            student_id: student.student_id,
            mitigation_type,
            notes: notes || null
        });

        const successMsg = `Mitigation applied successfully for student ${sId}.`;// Success message to be displayed after redirection
        res.redirect(`/admin/manageProgression/view/${sId}?success=${encodeURIComponent(successMsg)}`);
    } catch (error) {
        console.error('Error applying mitigation:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Failed to apply mitigation. Please try again later.'
        });
    }
};

// Show all mitigation records for students
exports.manageMitigations = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;
    const success = req.query.success || '';

    try {
        const { count, rows } = await StudentMitigation.findAndCountAll({
            include: [{
                model: Student,
                attributes: ['sId', 'first_name', 'last_name']
            }],
            limit,
            offset,
            order: [['applied_at', 'DESC']]
        });

        res.render('admin/manageProgression/manageMitigations', {
            mitigations: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            csrfToken: req.csrfToken(),
            success,
            error: ''
        });
    } catch (err) {
        console.error('Error fetching mitigation records:', err);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Failed to load mitigation records. Please try again later.'
        });
    }
};

// Render the editMitigation page with specific mitigation data
exports.renderEditMitigation = async (req, res) => {
    const mitigation_id = req.params.id;
    const page = req.query.page || 1;

    try {
        const mitigation = await StudentMitigation.findByPk(mitigation_id, {
            include: [{ model: Student, attributes: ['sId', 'first_name', 'last_name'] }]
        });

        if (!mitigation) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Mitigation record not found.'
            });
        }

        res.render('admin/manageProgression/editMitigation', {
            mitigation,
            page,
            csrfToken: req.csrfToken(),
            error: '',
            errors: {}
        });
    } catch (err) {
        console.error('Error rendering edit mitigation page:', err);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Error loading the mitigation record for editing. Please try again later.'
        });
    }
};

// Update an existing mitigation record
exports.updateMitigation = async (req, res) => {
    const { mitigation_id, mitigation_type, notes } = req.body;
    const page = req.query.page || 1;
    const errors = {};

    try { // Validate input fields
        if (!mitigation_type) errors.mitigation_type = 'Mitigation type is required.';
        if (!['MANUAL_DECISION', 'WAIVE_CORE_MODULE', 'IGNORE_MODULE_FAILURE'].includes(mitigation_type)) {
            errors.mitigation_type = 'Invalid mitigation type selected.';
        }
        
        const mitigation = await StudentMitigation.findByPk(mitigation_id, { // Fetch the mitigation record by ID
            include: [{ model: Student, attributes: ['sId', 'first_name', 'last_name'] }]
        });

        if (!mitigation) { // Check if the mitigation record exists
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Mitigation record not found.'
            });
        }
        if (Object.keys(errors).length > 0) {
            return res.status(400).render('error', {
            title: 'Bad Request',
            message: 'Invalid mitigation update request.'
            });
        }

        mitigation.mitigation_type = mitigation_type;
        mitigation.notes = notes || null;

        await mitigation.save();

        const successMsg = `Mitigation record for student ${mitigation.Student.sId} updated successfully.`;
        res.redirect(`/admin/manageMitigations?page=${page}&success=${encodeURIComponent(successMsg)}`);
    } catch (error) {
        console.error('Error updating mitigation:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Failed to update mitigation record. Please try again later.'
        });
    }
};

// Delete a mitigation record based on the mitigation_id
exports.deleteMitigation = async (req, res) => {
    const { mitigation_id } = req.body;
    const page = req.query.page || 1;

    try {
        const mitigation = await StudentMitigation.findByPk(mitigation_id);

        if (!mitigation) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Mitigation record not found.'
            });
        }

        await mitigation.destroy();

        const successMsg = `Mitigation record deleted successfully.`;
        res.redirect(`/admin/manageMitigations?page=${page}&success=${encodeURIComponent(successMsg)}`);
    } catch (error) {
        console.error('Error deleting mitigation:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Failed to delete mitigation record. Please try again later.'
        });
    }
};
