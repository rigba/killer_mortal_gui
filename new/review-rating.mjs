// Mortal rating formula from mjai-reviewer/src/review/mortal.rs (Apache-2.0).
export function matchGrade(score) {
    if (score >= 97) return 'S+';
    if (score >= 94) return 'S';
    if (score >= 90) return 'S-';
    if (score >= 87) return 'A+';
    if (score >= 84) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 77) return 'B+';
    if (score >= 74) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 67) return 'C+';
    if (score >= 64) return 'C';
    if (score >= 60) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
}

export function gradeFromRating(rating, reviewedDecisions) {
    if (!Number.isFinite(rating) || rating < 0 || rating > 1 || !(reviewedDecisions > 0)) return null;
    const score = rating * 100;
    return { score, grade: matchGrade(score), reviewedDecisions };
}

export function calculateReviewGrade(entries = []) {
    let totalDecisionScore = 0;
    let reviewedDecisions = 0;
    for (const entry of entries) {
        const details = entry?.details;
        if (!Array.isArray(details) || details.length <= 1) continue;
        const qValues = details.map(detail => detail.q_value);
        if (!qValues.every(Number.isFinite)) continue;
        let decisionScore;
        if (entry.is_equal === true) {
            // The engine's final recommendation can override its highest Q value.
            decisionScore = 1;
        } else {
            const actual = Number.isInteger(entry.actual_index) ? details[entry.actual_index] : null;
            if (!actual) continue;
            const min = Math.min(...qValues);
            const max = Math.max(...qValues);
            decisionScore = (actual.q_value - min) / Math.max(max - min, 1e-6);
        }
        totalDecisionScore += decisionScore;
        reviewedDecisions++;
    }
    if (!reviewedDecisions) return null;
    return gradeFromRating((totalDecisionScore / reviewedDecisions) ** 2, reviewedDecisions);
}

export function calculateReportGrade(review) {
    const supplied = gradeFromRating(review?.rating, review?.total_reviewed);
    if (supplied) return supplied;
    return calculateReviewGrade((review?.kyokus || []).flatMap(round => round.entries || []));
}

export function formatReviewGrade(result) {
    return result?.grade || '-';
}
