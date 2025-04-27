const apiClient = require('../../utils/apiClient');
const csv = require('csv-parser');
const fs = require('fs');
const { Student, Module } = require('../../models');

// Render the manageGrades page with student grades and pagination via API
exports.manageGrades = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 1;

    try {
        // Step 1: Fetch one student based on pagination
        const studentData = await apiClient.get('/students', { page, limit });

        let enrollments = [];
        if (studentData.students && studentData.students.length > 0) {
            const studentId = studentData.students[0].student_id;
            // Step 2: Fetch enrollments (grades) for that student
            enrollments = await apiClient.get('/grades', { student_id: studentId });
        }
        // Step 3: Render the page with the fetched data
        res.render('admin/manageGrades/grades', {
            enrollments,
            totalPages: studentData.totalPages,
            currentPage: studentData.currentPage
        });
    } catch (error) {
        console.error('Error fetching grades via API:', error);
        res.status(error.status || 500).send(error.message || 'Error fetching grades');
    }
};

// Render the uploadGrades page
exports.uploadGradesPage = (req, res) => {
    res.render('admin/manageGrades/uploadGrades', { csrfToken: req.csrfToken() });
};

// Update student grades by enrollment ID via API
exports.updateGrade = async (req, res) => {
    const { enrollmentId, firstGrade, gradeResult, resitGrade, resitResult } = req.body;
    try {
        const payload = {
            first_grade: firstGrade,
            grade_result: gradeResult,
            resit_grade: resitGrade || null,
            resit_result: resitResult || null
        };
        // Remove undefined fields
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        await apiClient.put(`/grades/${enrollmentId}`, payload);
        res.redirect('/admin/manageGrades'); // Consider redirecting to the same page
    } catch (error) {
        console.error('Error updating grade via API:', error);
        res.status(error.status || 500).send(`Error updating grade: ${error.message}`);
    }
};

// Delete student grades by enrollment ID via API
exports.deleteGrade = async (req, res) => {
    const { enrollmentId } = req.body;
    try {
        await apiClient.del(`/grades/${enrollmentId}`);
        res.status(200).send('Enrollment deleted successfully'); // For AJAX
    } catch (error) {
        console.error('Error deleting enrollment via API:', error);
        res.status(error.status || 500).send(`Error deleting enrollment: ${error.message}`); // For AJAX
    }
};

// Upload student grades via CSV file using API calls
// Reference: https://www.npmjs.com/package/csv-parser
exports.uploadGrades = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const errors = [];
    let successCount = 0;

    // Helper to parse CSV into an array of rows
    const parseCSV = (path) =>
        new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(path)
                .pipe(csv())
                .on('data', row => rows.push(row))
                .on('end', () => resolve(rows))
                .on('error', reject);
        });

    try {
        const rows = await parseCSV(filePath);

        for (const [idx, row] of rows.entries()) { // Use for..of to get index
            // Validate required fields
            const rowNum = idx + 1;
            try {
                const student = await Student.findOne({ where: { sId: row.sId } });
                const module = await Module.findOne({
                    where: {
                        subj_code: row.subjCode,
                        subj_catalog: row.subjCatalog
                    }
                });
                // Check if student and module exist
                if (!student || !module) {
                    errors.push(`Row ${rowNum}: Missing student or module.`);
                    continue;
                }
                await apiClient.post('/grades', {
                    student_id: student.student_id,
                    module_id: module.module_id,
                    first_grade: row.firstGrade,
                    grade_result: row.gradeResult,
                    resit_grade: row.resitGrade || null,
                    resit_result: row.resitResult || null,
                    attempt_count: row.attemptCount || 1
                });

                successCount++;
            } catch (e) {
                errors.push(`Row ${rowNum}: ${e.message}`);
            }
        }
        // Check if any errors occurred
        if (errors.length) {
            console.error('CSV upload errors:', errors);
            return res.status(500).send('Some grades could not be uploaded.');
        }
        res.redirect('/admin/manageGrades');
    } catch (e) {
        console.error('Error processing CSV file:', e);
        res.status(500).send('Error uploading grades.');
    } finally {
        fs.unlink(filePath, () => {}); // clean up temp file
    }
};
