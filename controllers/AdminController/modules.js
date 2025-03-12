const { Module, Enrollment } = require('../../models'); // Import models

// Render the manageModules page with pagination
exports.manageModules = async (req, res) => { // Same as the manageGrades function
    const page = parseInt(req.query.page) || 1;
    const limit = 15; // Number of modules per page
    const offset = (page - 1) * limit;

    try {
        const { count, rows: modules } = await Module.findAndCountAll({
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit); // Calculate total number of pages

        res.render('admin/manageModules/module', { modules, totalPages, currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching modules');
    }
};

// Add a new module
exports.addModule = async (req, res) => { 
    const { name, code, subjCatalog, creditValue, semester, pathwayCode } = req.body;
    try {
        await Module.create({
            module_title: name,
            subj_code: code,
            subj_catalog: subjCatalog,
            credit_value: creditValue,
            semester: semester,
            pathway_code: pathwayCode
        });
        res.redirect('/admin/manageModules');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding module');
    }
};

// Render the updateModule page with specific module details
exports.renderUpdateModule = async (req, res) => {
    const { moduleId } = req.query;
    try {
        const module = await Module.findOne({ where: { module_id: moduleId } }); // Find module by ID from the query
        if (module) {
            res.render('admin/manageModules/updateModule', { module });
        } else {
            res.status(404).send('Module not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching module details');
    }
};

// Update an existing module
exports.updateModule = async (req, res) => {
    const { moduleId, name, code, subjCatalog, creditValue, semester, pathwayCode } = req.body;
    try {
        const module = await Module.findOne({ where: { module_id: moduleId } });
        if (module) {
            await module.update({ // Update module details with new values from the form
                module_title: name || module.module_title,
                subj_code: code || module.subj_code,
                subj_catalog: subjCatalog || module.subj_catalog,
                credit_value: creditValue || module.credit_value,
                semester: semester || module.semester,
                pathway_code: pathwayCode || module.pathway_code
            });
            res.redirect('/admin/manageModules');
        } else {
            res.status(404).send('Module not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating module');
    }
};

// Delete a module
exports.deleteModule = async (req, res) => {
    const { moduleId } = req.body;
    try {
        const module = await Module.findOne({ where: { module_id: moduleId } }); // Find module by ID
        if (module) {
            await Enrollment.destroy({ where: { module_id: module.module_id } }); // Delete related enrollments
            await module.destroy();
            res.redirect('/admin/manageModules');
        } else {
            res.status(404).send('Module not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting module');
    }
};
