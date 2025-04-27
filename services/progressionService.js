const { Enrollment, Module, Student, Programme, StudentMitigation } = require('../models');
const { getProgressionRuleByProgrammeCode } = require('../utils/progressionRuleUtil');

function getModuleCode(m) { // Helper function to get the module code
    return m ? `${m.subj_code}${m.subj_catalog}` : null;
}

function filterLatestEnrollments(enrollments) { // Filter to get the latest enrollment for each module
    const rank = { // Rank for each result type with pass as the highest and fail as the lowest
        'pass': 5,
        'pass capped': 4,
        'excused': 3,
        'absent': 2,
        'fail': 1
    };
    function getRank(e) { // Helper function to get the rank of an enrollment
        const r = (e.resit_result || e.grade_result || '').toLowerCase();
        return rank[r] || 0;
    }

    const map = new Map();

    enrollments.forEach(e => { // Iterate through each enrollment
        const prev = map.get(e.module_id);
        if (!prev) {
            map.set(e.module_id, e);
        } else {
            const prevRank = getRank(prev);
            const currRank = getRank(e);
            if (
                currRank > prevRank ||
                (currRank === prevRank && e.attempt_count > prev.attempt_count)
            ) {
                map.set(e.module_id, e);
            }
        }
    });
    return Array.from(map.values());
}

// Calculate level stats based on enrollments and rules
function calcLevelStats(enrollments, rules, compulsoryModuleCodes, options = {}) {
    const { ignoreCore = false, ignoreCap = false } = options;
    const filtered = filterLatestEnrollments(enrollments);
    let passedCredits = 0, totalGradePoints = 0, totalCreditsForAvg = 0, modulesPassed = 0, modulesFailed = 0, modulesExcused = 0, modulesRequiringResit = 0, modulesAbsent = 0;
    let failedCore = [];
    const minCreditsRequired = rules.total_credits_required;
    const minPassMark = parseFloat(rules.min_pass_mark);
    const defaultPassMark = 40.00;
    const relevantPassMark = (minPassMark === defaultPassMark) ? defaultPassMark : minPassMark;
    const coreCatalogs = compulsoryModuleCodes
        .map(code => code.match(/\d+$/)?.[0]) // Extract the catalog number using regex to filter one or more digits at the end of the string.
        .filter(Boolean);

    filtered.forEach(e => { // filter through each enrollment to calculate stats
        const m = e.Module, code = getModuleCode(m);
        const firstResult = (e.grade_result || '').toLowerCase();
        const resitResult = (e.resit_result || '').toLowerCase();
        const finalResultIsExcused = (resitResult === 'excused') || (firstResult === 'excused' && !resitResult);
        const finalResultIsAbsent = (resitResult === 'absent') || (firstResult === 'absent' && !resitResult);

        let actualGrade = null;
        if (e.resit_grade != null) { 
            actualGrade = parseFloat(e.resit_grade);
        } else if (e.first_grade != null) {
            actualGrade = parseFloat(e.first_grade);
        }

        let gradeForCheckAndAvg = actualGrade;
        if (resitResult === 'pass capped' && !ignoreCap) { 
            const cappingThreshold = defaultPassMark;
            if (gradeForCheckAndAvg != null && gradeForCheckAndAvg > cappingThreshold) {
                gradeForCheckAndAvg = cappingThreshold;
            }
        }
        let isPass = false;
        if (finalResultIsExcused) {
            modulesExcused++;
            modulesRequiringResit++;
            e.calculatedFinalResult = 'Excused';
        } else if (finalResultIsAbsent) {
            modulesAbsent++;
            modulesFailed++;
            modulesRequiringResit++;
            if (coreCatalogs.includes(m.subj_catalog) && !ignoreCore) failedCore.push(code);
            if (coreCatalogs.includes(m.subj_catalog) && ignoreCore) e.calculatedFinalResult = 'Waived';
            else e.calculatedFinalResult = 'Absent';
        } else if (gradeForCheckAndAvg != null && gradeForCheckAndAvg >= relevantPassMark) {
            isPass = true;
            passedCredits += m.credit_value;
            modulesPassed++;
            e.calculatedFinalResult = (resitResult === 'pass capped' && !ignoreCap) ? 'Pass Capped' : 'Pass';
        } else if (actualGrade != null) {
            modulesFailed++;
            modulesRequiringResit++;
            if (coreCatalogs.includes(m.subj_catalog) && !ignoreCore) failedCore.push(code);
            if (coreCatalogs.includes(m.subj_catalog) && ignoreCore) e.calculatedFinalResult = 'Waived';
            else e.calculatedFinalResult = 'Fail';
        } else {
            modulesRequiringResit++;
            if (coreCatalogs.includes(m.subj_catalog) && !ignoreCore) failedCore.push(code);
            if (coreCatalogs.includes(m.subj_catalog) && ignoreCore) e.calculatedFinalResult = 'Waived';
            else e.calculatedFinalResult = 'Pending';
        }
        if (actualGrade != null && !finalResultIsExcused) {
            totalGradePoints += gradeForCheckAndAvg * m.credit_value; // Use the potentially capped grade
            totalCreditsForAvg += m.credit_value;
        }
    });

    const meetsCredit = passedCredits >= minCreditsRequired;
    const allCorePassed = ignoreCore ? true : (failedCore.length === 0);
    const avg = totalCreditsForAvg > 0 ? (totalGradePoints / totalCreditsForAvg) : null;
    const levelPassed = meetsCredit && allCorePassed;

    return {
        totalCredits: passedCredits,
        requiredCredits: minCreditsRequired,
        modulesPassed,
        modulesFailed,
        modulesExcused,
        modulesAbsent,
        modulesRequiringResit,
        failedCore,
        enrollments: filtered,
        meetsCredit,
        allCorePassed,
        levelPassed,
        averagePercentage: avg != null ? parseFloat(avg.toFixed(2)) : null
    };
}

// Determine the level decision based on stats and rules
function levelDecision(stats, levelNum, rules) { 
    const minAvgGrade = rules.min_avg_grade;
    const requiredCredits = rules.total_credits_required;

    if (stats.levelPassed && (stats.averagePercentage == null || stats.averagePercentage >= minAvgGrade)) { // Check if the level is passed and average percentage is above the minimum
        return `Pass - Completed Level ${levelNum} requirements (${stats.totalCredits}/${requiredCredits} credits` +
            (stats.averagePercentage != null ? `, Avg: ${stats.averagePercentage}%)` : ')') +
            (stats.modulesExcused > 0 ? `. Note: ${stats.modulesExcused} excused module(s) - eligible for resit.` : '') +
            (stats.modulesAbsent > 0 ? `. Note: ${stats.modulesAbsent} absent module(s) - eligible for resit.` : '');
    }
    let msg = `Not completed - Level ${levelNum} requirements not met.`;
    if (!stats.meetsCredit) msg += ` Insufficient credits (${stats.totalCredits}/${requiredCredits}).`; // Check if credits are sufficient
    if (!stats.allCorePassed) msg += ` Failed core module(s): ${stats.failedCore.join(', ')}.`; // Check if all core modules are passed
    if (stats.averagePercentage != null && stats.averagePercentage < minAvgGrade) msg += ` Average (${stats.averagePercentage}%) below minimum ${minAvgGrade}%.`; // Check if average percentage is below minimum
    else if (stats.averagePercentage == null && stats.totalCredits > 0) msg += ` Average calculation pending.`; // Check if average percentage is pending

    if (stats.modulesFailed > 0 || stats.modulesExcused > 0 || stats.modulesAbsent > 0) msg += ` Resit opportunity for failed/absent/excused module(s).`; // Check if there are any failed, excused, or absent modules
    if (!stats.levelPassed && stats.totalCredits < requiredCredits / 2) msg += ` Consider repeating the year/level.`; // Check if total credits are less than half of required credits
    return msg;
}

// Overall decision based on level 1 and level 2 stats
function overallDecision(l1, l2, rulesL1, rulesL2) {
    const requiredL1CreditsOverall = rulesL1.total_credits_required;

    if (l2.enrollments.length === 0 && l1.levelPassed) // If there are no Level 2 enrollments and Level 1 is passed
        return "Progression Decision: Eligible to progress to Level 2. Level 1 requirements fully completed.";
    if (l2.enrollments.length === 0 && !l1.levelPassed) // If there are no Level 2 enrollments and Level 1 is not passed
        return `Progression Decision: Not eligible to progress to Level 2. Level 1 requirements not met (${l1.levelDecision}).`;
    if (l2.enrollments.length === 0) // If there are no Level 2 enrollments
        return `Progression Decision: Eligible to progress to Level 2. Level 1 requirements partially completed (${l1.levelDecision}).`;

    if (l2.levelPassed && l1.totalCredits >= requiredL1CreditsOverall) // If Level 2 is passed and Level 1 credits are sufficient
        return "Progression Decision: Eligible to progress to the final year. All Level 1 and Level 2 requirements completed.";
    if (l2.levelPassed && l1.totalCredits < requiredL1CreditsOverall) // If Level 2 is passed but Level 1 credits are not sufficient
        return `Progression Decision: Not eligible for progression to the final year. All Level 1 modules (${requiredL1CreditsOverall} credits) must be passed (currently ${l1.totalCredits}).`;
    if (!l2.levelPassed) { // If Level 2 is not passed
        if (l1.totalCredits >= requiredL1CreditsOverall) {
            return `Progression Decision: Level 1 completed but Level 2 requirements not met (${l2.levelDecision}).`;
        } else { // If Level 1 credits are not sufficient
            return `Progression Decision: Not eligible for progression. Level 1 requirements not fully met (Need ${requiredL1CreditsOverall} credits, have ${l1.totalCredits}) and Level 2 requirements not met (${l2.levelDecision}).`;
        }
    }
    if (!l1.levelPassed) // If Level 1 is not passed
        return `Progression Decision: Not eligible for progression to Level 2. Level 1 requirements not met (${l1.levelDecision}).`;

    return "Progression Decision: Unable to determine progression. Contact academic support."; // Fallback message if no conditions are met
}

function handleComplex(l1, l2) {
    const complexMessage = "Complex case: Kindly contact an Academic Advisor!";
    // New check: Student has L2 enrollments but no L1 enrollments
    if (l1.enrollments.length === 0 && l2.enrollments.length > 0) {
        return "Complex case: Student has Level 2 enrollments without Level 1 data. Please review with an Academic Advisor.";
    }
    if (!l1.levelPassed && l1.totalCredits < 40)
        return complexMessage;
    if (l2.enrollments.length === 0) return null; // No L2 enrollments, not complex based on L2 credits
    if (!l2.levelPassed && l2.totalCredits < 40)
        return complexMessage;
    return null; // Not identified as a complex case by these rules
}

// Main function to get progression decision
async function getProgressionDecision(student_id) {
    const student = await Student.findOne({
        where: { student_id },
        include: [
            { model: Programme },
            { model: Enrollment, as: 'Enrollments', include: [{ model: Module }] },
            {
                model: StudentMitigation,
                as: 'Mitigations',
                order: [['applied_at', 'DESC']] // Get the latest mitigation first
            }
        ]
    });

    if (!student || !student.Programme) { // Check if student and programme information is available
        return { decision: "Error: Missing student or programme information.", level1Stats: {}, level2Stats: {} };
    }

    const enrollments = student.Enrollments || [];
    const progCode = student.Programme.programme_code;

    const rules = await getProgressionRuleByProgrammeCode(progCode); // Get progression rules based on programme code
    if (!rules) {
        console.error(`Progression rules not found for programme code: ${progCode}`);
        return { decision: `Error: Progression rules not defined for programme ${progCode}.`, level1Stats: {}, level2Stats: {} };
    }

    const compulsoryModuleCodes = rules.compulsory_modules ? rules.compulsory_modules.split(',').map(s => s.trim()).filter(Boolean) : [];

    let l1 = [], l2 = [];
    enrollments.forEach(e => { // Iterate through each enrollment to categorize them into Level 1 and Level 2
        const m = e.Module, c = parseInt(m.subj_catalog), s = m.subj_code;
        if (s === 'IFSY') {
            if (c >= 123 && c <= 133) l1.push(e); // Level 1 modules
            else if ((c >= 239 && c <= 266) || c === 211 || c === 259 || c === 240) l2.push(e);
        } else if (s === 'BSAS') { // Business Analytics and Statistics modules
            if (c >= 102 && c <= 113) l1.push(e);
            else if (c >= 205 && c <= 227) l2.push(e);
        } else if (s === 'FINA' && c === 107) l1.push(e); // Also FINA module (part of acadmic pathway)
    });

    let ignoreCore = false;
    let ignoreCap = false;

    // Check for applied mitigations and set flags
    if (student.Mitigations && student.Mitigations.length > 0) {
        const latestMitigation = student.Mitigations[0];
        switch (latestMitigation.mitigation_type) {
            case 'WAIVE_CORE_MODULE':
                ignoreCore = true; 
                break;
            case 'IGNORE_MODULE_FAILURE':
                ignoreCap = true;
                break;
        }
    }

    const level1Stats = calcLevelStats(l1, rules, compulsoryModuleCodes, { ignoreCore, ignoreCap });
    const level2Stats = calcLevelStats(l2, rules, compulsoryModuleCodes, { ignoreCore, ignoreCap });

    level1Stats.levelDecision = levelDecision(level1Stats, 1, rules); // Calculate level decision for Level 1
    level2Stats.levelDecision = levelDecision(level2Stats, 2, rules); // Calculate level decision for Level 2

    const complex = handleComplex(level1Stats, level2Stats); // Check for complex cases
    let finalDecision = complex || overallDecision(level1Stats, level2Stats, rules, rules);

    // Show mitigation message and override decision if necessary
    if (student.Mitigations && student.Mitigations.length > 0) {
        const latestMitigation = student.Mitigations[0]; // Get the most recent one
        let mitigationText = `Mitigation Applied: `;

        switch (latestMitigation.mitigation_type) {
            case 'MANUAL_DECISION':
                mitigationText += "Manual Progression Decision Made. Contact academic support for details.";
                break;
            case 'WAIVE_CORE_MODULE':
                mitigationText += "Core Module Requirement Waived. Contact academic support for details.";
                break;
            case 'IGNORE_MODULE_FAILURE':
                mitigationText += "Capped Requirement Removed. Contact academic support for details.";
                break;
            default:
                mitigationText += "Custom Mitigation Applied. Contact academic support for details.";
        }
        if (latestMitigation.notes) {
            mitigationText += ` Notes: ${latestMitigation.notes}`;
        }
        finalDecision = mitigationText; // Override the calculated decision
    }

    return {
        level1Stats,
        level2Stats,
        decision: finalDecision // Return the potentially overridden decision
    };
}

module.exports = { getProgressionDecision };