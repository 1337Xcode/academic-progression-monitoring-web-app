const apiClient = require('../../utils/apiClient');

// Render the manageModules page with pagination via API
exports.manageModules = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;

    try {
        const data = await apiClient.get('/modules', { page, limit });
        res.render('admin/manageModules/module', {
            modules: data.modules,
            totalPages: data.totalPages,
            currentPage: data.currentPage
        });
    } catch (error) {
        console.error('Error fetching modules via API:', error);
        res.status(error.status || 500).send(error.message || 'Error fetching modules');
    }
};

// Add a new module via API
exports.addModule = async (req, res) => {
    const { name, code, subjCatalog, creditValue, semester, pathwayCode, programmeId, isCore } = req.body;
    try {
        const payload = {
            module_title: name,
            subj_code: code,
            subj_catalog: subjCatalog,
            credit_value: creditValue,
            semester: semester,
            pathway_code: pathwayCode,
            programme_id: programmeId,
            is_core: isCore
        };
        await apiClient.post('/modules', payload);
        res.redirect('/admin/manageModules');
    } catch (error) {
        console.error('Error adding module via API:', error);
        res.status(error.status || 500).send(`Error adding module: ${error.message}`);
    }
};

// Render the updateModule page with specific module details via API
exports.renderUpdateModule = async (req, res) => {
    const { moduleId } = req.query; // PK
    try {
        const module = await apiClient.get(`/modules/${moduleId}`);
        res.render('admin/manageModules/updateModule', { module });
    } catch (error) {
        console.error('Error fetching module details via API:', error);
        if (error.status === 404) return res.status(404).send('Module not found');
        res.status(error.status || 500).send(error.message || 'Error fetching module details');
    }
};

// Update an existing module via API
exports.updateModule = async (req, res) => {
    const { moduleId, name, code, subjCatalog, creditValue, semester, pathwayCode, programmeId, isCore } = req.body; // moduleId is PK
    try {
        const payload = {
            module_title: name,
            subj_code: code,
            subj_catalog: subjCatalog,
            credit_value: creditValue,
            semester: semester,
            pathway_code: pathwayCode,
            programme_id: programmeId,
            is_core: isCore
        };
        // Remove undefined fields
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        await apiClient.put(`/modules/${moduleId}`, payload);
        res.redirect('/admin/manageModules');
    } catch (error) {
        console.error('Error updating module via API:', error);
        res.status(error.status || 500).send(`Error updating module: ${error.message}`);
    }
};

// Delete a module with related enrollments via API
exports.deleteModule = async (req, res) => {
    const { moduleId } = req.body; // PK
    try {
        await apiClient.del(`/modules/${moduleId}`); // API handles deleting related enrollments
        res.redirect('/admin/manageModules');
    } catch (error) {
        console.error('Error deleting module via API:', error);
        res.status(error.status || 500).send(`Error deleting module: ${error.message}`);
    }
};
