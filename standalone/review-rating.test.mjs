import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculateReportGrade,
    calculateReviewGrade,
    formatReviewGrade,
    gradeFromRating,
    matchGrade,
} from '../new/review-rating.mjs';

function entry(qValues, actualIndex, isEqual = false) {
    return {
        details: qValues.map(q_value => ({ q_value })),
        actual_index: actualIndex,
        is_equal: isEqual,
    };
}

test('normalizes Q values, averages decisions, then squares the average', () => {
    const result = calculateReviewGrade([entry([-1, 0, 1], 2, true), entry([-1, .2, 1], 1)]);
    assert.ok(Math.abs(result.score - 64) < 1e-10);
    assert.equal(result.grade, 'C');
    assert.equal(result.reviewedDecisions, 2);
});

test('uses final engine agreement even when another action has a higher Q', () => {
    assert.equal(calculateReviewGrade([entry([0, 1], 0, true)]).score, 100);
});

test('uses an epsilon for equal Q values', () => {
    assert.equal(calculateReviewGrade([entry([1, 1], 0)]).score, 0);
    assert.equal(calculateReviewGrade([entry([1, 1], 0, true)]).score, 100);
});

test('excludes forced choices and invalid or missing evaluations', () => {
    const result = calculateReviewGrade([
        entry([1], 0, true), entry([NaN, 1], 1), entry([0, 1], 9),
        entry([0, 1], undefined), {}, entry([0, 1], 1, true),
    ]);
    assert.equal(result.reviewedDecisions, 1);
    assert.equal(result.score, 100);
    assert.equal(calculateReviewGrade([]), null);
});

test('preserves supplied overall rating even when entries disagree', () => {
    const result = calculateReportGrade({
        rating: .9440007442244255,
        total_reviewed: 91,
        kyokus: [{ entries: [entry([0, 1], 0)] }],
    });
    assert.equal(result.score, 94.40007442244254);
    assert.equal(result.grade, 'S');
    assert.equal(formatReviewGrade(result), 'S');
});

test('fallback includes every round and weights decisions before squaring', () => {
    const result = calculateReportGrade({ kyokus: [
        { entries: [entry([0, 1], 1, true)] },
        { entries: [entry([0, 1], 0), entry([0, 1], 0)] },
    ] });
    assert.equal(result.reviewedDecisions, 3);
    assert.ok(Math.abs(result.score - 100 / 9) < 1e-10);
});

test('ratings do not depend on display probabilities or temperature', () => {
    const a = entry([0, .8, 1], 1);
    const b = { ...a, details: a.details.map(d => ({ ...d, prob: .001 })) };
    assert.deepEqual(calculateReviewGrade([a]), calculateReviewGrade([b]));
});

test('keeps existing letter thresholds and handles unavailable ratings', () => {
    for (const [score, grade] of [[97,'S+'],[94,'S'],[90,'S-'],[87,'A+'],[84,'A'],[80,'A-'],[77,'B+'],[74,'B'],[70,'B-'],[67,'C+'],[64,'C'],[60,'C-'],[50,'D'],[49,'F']]) {
        assert.equal(matchGrade(score), grade);
    }
    assert.equal(gradeFromRating(NaN, 1), null);
    assert.equal(gradeFromRating(-1, 1), null);
    assert.equal(gradeFromRating(2, 1), null);
    assert.equal(gradeFromRating(1, 0), null);
    assert.equal(calculateReportGrade(undefined), null);
    assert.equal(formatReviewGrade(null), '-');
});
