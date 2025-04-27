const { ProgressionRule } = require('../models');

// This function retrieves a progression rule based on the provided programme code.
async function getProgressionRuleByProgrammeCode(programmeCode) {
    return ProgressionRule.findOne({ where: { programme_code: programmeCode } });
}

module.exports = {
    getProgressionRuleByProgrammeCode
};
