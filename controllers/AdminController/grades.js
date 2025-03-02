const { Enrollment, Student, Module } = require('../../models'); // Import models
const csv = require('csv-parser');
const fs = require('fs');

// Render the manageGrades page with student grades and pagination based on individual students
exports.manageGrades = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 1; // Number of students per page
    const offset = (page - 1) * limit;

    try {
        const students = await Student.findAndCountAll({
            limit,
            offset,
            order: [['student_id', 'ASC']] // Order by student ID
        });

        const totalPages = Math.ceil(students.count / limit);

        const enrollments = await Enrollment.findAll({
            where: { student_id: students.rows[0].student_id },
            include: [
                { model: Student, attributes: ['first_name', 'last_name', 'sId'] },
                { model: Module, attributes: ['module_title', 'subj_code', 'subj_catalog'] }
            ]
        });

        res.render('admin/manageGrades/grades', { enrollments, totalPages, currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching grades');
    }
};

// Render the uploadGrades page
exports.uploadGradesPage = (req, res) => {
    res.render('admin/manageGrades/uploadGrades');
};

// Update student grades
exports.updateGrade = async (req, res) => {
    const { enrollmentId, firstGrade, gradeResult, resitGrade, resitResult } = req.body;
    try {
        const enrollment = await Enrollment.findOne({ where: { enrollment_id: enrollmentId } });
        if (enrollment) {
            await enrollment.update({
                first_grade: firstGrade,
                grade_result: gradeResult,
                resit_grade: resitGrade,
                resit_result: resitResult
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

// Delete student grades
exports.deleteGrade = async (req, res) => {
    const { enrollmentId } = req.body;
    try {
        const enrollment = await Enrollment.findOne({ where: { enrollment_id: enrollmentId } });
        if (enrollment) {
            await enrollment.destroy();
            res.redirect('/admin/manageGrades');
        } else {
            res.status(404).send('Enrollment not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting grade');
    }
};

// Upload student grades via CSV
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
                    const student = await Student.findOne({ where: { sId: row.sId } });
                    const module = await Module.findOne({ where: { subj_code: row.subjCode, subj_catalog: row.subjCatalog } });
                    if (student && module) {
                        await Enrollment.create({
                            student_id: student.student_id,
                            module_id: module.module_id,
                            first_grade: row.firstGrade,
                            grade_result: row.gradeResult,
                            resit_grade: row.resitGrade,
                            resit_result: row.resitResult,
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
