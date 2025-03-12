const User = require('./User');
const Student = require('./Student');
const Module = require('./Module');
const Programme = require('./Programme');
const Enrollment = require('./Enrollment');

// Define associations
User.hasOne(Student, { foreignKey: 'user_id' });
Student.belongsTo(User, { foreignKey: 'user_id' });

Programme.hasMany(Module, { foreignKey: 'programme_id' });
Module.belongsTo(Programme, { foreignKey: 'programme_id' });

Student.hasMany(Enrollment, { foreignKey: 'student_id' });
Enrollment.belongsTo(Student, { foreignKey: 'student_id' });

Module.hasMany(Enrollment, { foreignKey: 'module_id' });
Enrollment.belongsTo(Module, { foreignKey: 'module_id' });

// Export models
module.exports = {
    User,
    Student,
    Module,
    Programme,
    Enrollment
};
