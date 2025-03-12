const { Enrollment, Student, Module } = require('../../models'); // Import models
const csv = require('csv-parser');
const fs = require('fs');

// Render the manageGrades page with student grades and pagination based on individual students
exports.manageGrades = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = 1; // Number of students per page
    const offset = (page - 1) * limit; // Offset for pagination calculation (page 1: 0, page 2: 1, page 3: 2, etc.)

    try {
        const students = await Student.findAndCountAll({
            limit, // Limit number of students per page
            offset, // Offset for pagination
            order: [['student_id', 'ASC']] // Order by student ID
        });

        const totalPages = Math.ceil(students.count / limit);

        if (students.rows.length === 0) {
            return res.render('admin/manageGrades/grades', { enrollments: [], totalPages, currentPage: page });
        }

        const enrollments = await Enrollment.findAll({
            where: { student_id: students.rows[0].student_id },
            include: [
                { model: Student, attributes: ['first_name', 'last_name', 'sId'] }, // Include student details in the query
                { model: Module, attributes: ['module_title', 'subj_code', 'subj_catalog'] } // Include module details in the query
            ]
        });

        res.render('admin/manageGrades/grades', { enrollments, totalPages, currentPage: page }); // Render the manageGrades page with student grades
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching grades');
    }
};

// Render the uploadGrades page to upload student grades via CSV file
exports.uploadGradesPage = (req, res) => {
    // Ensure the CSRF token is passed to the view
    res.render('admin/manageGrades/uploadGrades', { csrfToken: req.csrfToken() });
};

// Update student grades by enrollment ID
exports.updateGrade = async (req, res) => {
    const { enrollmentId, firstGrade, gradeResult, resitGrade, resitResult } = req.body;
    try {
        const enrollment = await Enrollment.findOne({ where: { enrollment_id: enrollmentId } }); // Find enrollment by ID
        if (enrollment) {
            await enrollment.update({
                first_grade: firstGrade, // Update first grade
                grade_result: gradeResult, // Update grade result
                resit_grade: resitGrade || null, // Update resit grade, default to null if empty
                resit_result: resitResult || null // Update resit result, default to null if empty
            });
            res.redirect('/admin/manageGrades');
        } else {
            res.status(404).send('Enrollment not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating grade');
    }
};

// Delete student grades by enrollment ID
exports.deleteGrade = async (req, res) => {
    const { enrollmentId } = req.body;
    try {
        const enrollment = await Enrollment.findOne({ where: { enrollment_id: enrollmentId } }); // Find enrollment by ID
        if (enrollment) {
            await enrollment.destroy(); // Delete enrollment from database
            res.status(200).send('Enrollment deleted successfully');
        } else {
            res.status(404).send('Enrollment not found');
        }
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        res.status(500).send('Error deleting enrollment');
    }
};

// Upload student grades via CSV file
exports.uploadGrades = async (req, res) => {
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            results.push(row);
        })
        .on('end', async () => {
            try {
                for (const row of results) {
                    const student = await Student.findOne({ where: { sId: row.sId } }); // Find student by student ID (sId)
                    const module = await Module.findOne({ where: { subj_code: row.subjCode, subj_catalog: row.subjCatalog } }); // Find module by subject code and catalog number
                    if (student && module) {
                        await Enrollment.create({ // Create new enrollment record
                            student_id: student.student_id,
                            module_id: module.module_id,
                            first_grade: row.firstGrade,
                            grade_result: row.gradeResult,
                            resit_grade: row.resitGrade || null,
                            resit_result: row.resitResult || null,
                            attempt_count: row.attemptCount || 1
                        });
                    }
                }
                res.redirect('/admin/manageGrades');
            } catch (error) {
                console.error(error);
                res.status(500).send('Error uploading grades');
            }
        });
};
