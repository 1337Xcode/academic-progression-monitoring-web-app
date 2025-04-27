const User = require('./User');
const Student = require('./Student');
const Module = require('./Module');
const Programme = require('./Programme');
const Enrollment = require('./Enrollment');
const Notification = require('./Notification');
const ProgressionRule = require('./ProgressionRule');
const StudentMitigation = require('./StudentMitigation'); // Import the new model

// Define associations
User.hasOne(Student, { foreignKey: 'user_id' });
Student.belongsTo(User, { foreignKey: 'user_id' });

Programme.hasMany(Module, { foreignKey: 'programme_id' });
Module.belongsTo(Programme, { foreignKey: 'programme_id' });

// Add this missing association between Student and Programme
Programme.hasMany(Student, { foreignKey: 'programme_id' });
Student.belongsTo(Programme, { foreignKey: 'programme_id' });

Student.hasMany(Enrollment, { foreignKey: 'student_id', as: 'Enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'student_id' });

Module.hasMany(Enrollment, { foreignKey: 'module_id', as: 'Enrollments' });
Enrollment.belongsTo(Module, { foreignKey: 'module_id' });

Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
// Add association between Notification and Student
Notification.belongsTo(Student, { foreignKey: 'student_id', as: 'Recipient' });

// Add association between Student and StudentMitigation
Student.hasMany(StudentMitigation, { foreignKey: 'student_id', as: 'Mitigations' });
StudentMitigation.belongsTo(Student, { foreignKey: 'student_id' });

// Export models
module.exports = {
    User,
    Student,
    Module,
    Programme,
    Enrollment,
    Notification,
    ProgressionRule,
    StudentMitigation // Add the new model to exports
};
