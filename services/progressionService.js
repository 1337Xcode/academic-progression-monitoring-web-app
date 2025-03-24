const { Enrollment, Module, Student, Programme } = require('../models');

const CORE_MODULES = {
    IFSY: { level1: [], level2: ['259', '240'] },
    BSAS: { level1: [], level2: ['257'] }
};

function getModuleCode(m) {
    return m ? `${m.subj_code}${m.subj_catalog}` : null;
}

function filterLatestEnrollments(enrollments) {
    // Define result ranking
    const rank = {
        'pass': 5,
        'pass capped': 4,
        'excused': 3,
        'absent': 2,
        'fail': 1
    };
    function getRank(e) {
        const r = (e.resit_result || e.grade_result || '').toLowerCase();
        return rank[r] || 0;
    }

    const map = new Map();
    enrollments.forEach(e => {
        const prev = map.get(e.module_id);
        if (!prev) {
            map.set(e.module_id, e);
        } else {
            const prevRank = getRank(prev);
            const currRank = getRank(e);
            // Prefer higher rank, or higher attempt if same rank
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

function calcLevelStats(enrollments, minCredits, coreModules) {
    const filtered = filterLatestEnrollments(enrollments);
    let passedCredits = 0, totalGrade = 0, totalCredits = 0, modulesPassed = 0, modulesFailed = 0, modulesExcused = 0, modulesRequiringResit = 0;
    let failedCore = [];
    filtered.forEach(e => {
        const m = e.Module, code = getModuleCode(m);
        const result = (e.resit_result || e.grade_result || '').toLowerCase();
        let grade = e.resit_grade ?? e.first_grade;
        // Cap grade at 40 if pass capped
        if (result === 'pass capped' && grade != null) {
            grade = Math.min(grade, 40);
        }
        // Only include for average if not excused
        if (grade != null && result !== 'excused') {
            totalGrade += parseFloat(grade) * m.credit_value;
            totalCredits += m.credit_value;
        }
        if (['pass', 'pass capped'].includes(result)) {
            passedCredits += m.credit_value; modulesPassed++;
        } else if (result === 'excused') {
            modulesExcused++; modulesRequiringResit++;
        } else if (['fail', 'absent'].includes(result)) {
            modulesFailed++; modulesRequiringResit++;
            if (coreModules.includes(m.subj_catalog)) failedCore.push(code);
        }
    });
    const meetsCredit = passedCredits >= minCredits;
    const allCorePassed = failedCore.length === 0;
    const avg = totalCredits > 0 ? (totalGrade / totalCredits).toFixed(2) : null;
    const levelPassed = meetsCredit && allCorePassed;
    return { totalCredits: passedCredits, requiredCredits: minCredits, modulesPassed, modulesFailed, modulesExcused, modulesRequiringResit, failedCore, enrollments: filtered, meetsCredit, allCorePassed, levelPassed, averagePercentage: avg };
}

function levelDecision(stats, levelNum) {
    if (stats.levelPassed && stats.averagePercentage >= 40) {
        return `Pass - Completed Level ${levelNum} requirements (${stats.totalCredits}/${stats.requiredCredits} credits, Avg: ${stats.averagePercentage}%)` +
            (stats.modulesExcused > 0 ? `. Note: ${stats.modulesExcused} excused module(s) - eligible for resit.` : '');
    }
    let msg = `Not completed - Level ${levelNum} requirements not met.`;
    if (!stats.meetsCredit) msg += ` Insufficient credits (${stats.totalCredits}/${stats.requiredCredits}).`;
    if (!stats.allCorePassed) msg += ` Failed core module(s).`;
    if (stats.averagePercentage < 40) msg += ` Average (${stats.averagePercentage}%) below 40%.`;
    if (stats.modulesFailed > 0 || stats.modulesExcused > 0) msg += ` Resit opportunity for failed/absent/excused module(s).`;
    if (stats.totalCredits < stats.requiredCredits / 2) msg += ` Consider repeating the year/level.`;
    return msg;
}

function overallDecision(l1, l2) {
    if (l2.enrollments.length === 0 && l1.levelPassed)
        return "Progression Decision: Eligible to progress to Level 2. Level 1 requirements fully completed.";
    if (l2.enrollments.length === 0)
        return "Progression Decision: Eligible to progress to Level 2. Level 1 requirements partially completed.";
    if (l2.levelPassed && l1.totalCredits >= 120)
        return "Progression Decision: Eligible to progress to the final year. All Level 1 and Level 2 requirements completed.";
    if (l2.levelPassed && l1.totalCredits < 120)
        return "Progression Decision: Not eligible for progression to the final year. All Level 1 modules (120 credits) must be passed.";
    if (!l2.levelPassed)
        return "Progression Decision: Level 1 completed but Level 2 requirements not met.";
    if (!l1.levelPassed)
        return "Progression Decision: Not eligible for progression to next level. Level 1 requirements (100 credits) must be completed first.";
    return "Progression Decision: Unable to determine progression. Contact academic support.";
}

function handleComplex(l1, l2) {
    if (!l1.levelPassed && l1.totalCredits < 40)
        return "Complex case: Performance is significantly below requirements. Refer to academic support.";
    if (l2.enrollments.length === 0) return null;
    if (!l2.levelPassed && l2.totalCredits < 40)
        return "Complex case: Performance is significantly below requirements for Level 2. Refer to academic support.";
    return null;
}

async function getProgressionDecision(student_id) {
    const student = await Student.findOne({
        where: { student_id },
        include: [
            { model: Programme },
            { model: Enrollment, as: 'Enrollments', include: [{ model: Module }] }
        ]
    });
    if (!student || !student.Programme) {
        return { decision: "Error: Missing student or programme information.", level1Stats: {}, level2Stats: {} };
    }
    const enrollments = student.Enrollments || [];
    const progCode = student.Programme.programme_code;
    let l1 = [], l2 = [];
    enrollments.forEach(e => {
        const m = e.Module, c = parseInt(m.subj_catalog), s = m.subj_code;
        if (s === 'IFSY') {
            if (c >= 123 && c <= 133) l1.push(e);
            else if ((c >= 239 && c <= 266) || c === 211 || c === 259 || c === 240) l2.push(e);
        } else if (s === 'BSAS') {
            if (c >= 102 && c <= 113) l1.push(e);
            else if (c >= 205 && c <= 227) l2.push(e);
        } else if (s === 'FINA' && c === 107) l1.push(e);
    });
    const level1Stats = calcLevelStats(l1, 100, CORE_MODULES[progCode]?.level1 || []);
    const level2Stats = calcLevelStats(l2, 100, CORE_MODULES[progCode]?.level2 || []);
    level1Stats.levelDecision = levelDecision(level1Stats, 1);
    level2Stats.levelDecision = levelDecision(level2Stats, 2);
    const complex = handleComplex(level1Stats, level2Stats);
    return {
        level1Stats,
        level2Stats,
        decision: complex || overallDecision(level1Stats, level2Stats)
    };
}

module.exports = { getProgressionDecision };