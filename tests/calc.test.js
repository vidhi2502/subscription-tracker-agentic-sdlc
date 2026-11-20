'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const calc = require('../src/calc');

function validInput(overrides = {}) {
  return {
    name: 'Netflix',
    cost: 199,
    cycle: 'monthly',
    renewalDate: '2026-12-01',
    ...overrides,
  };
}

function localDate(year, month, day) {
  return new Date(year, month - 1, day);
}

describe('findValidationError', () => {
  it('accepts a valid subscription', () => {
    assert.strictEqual(calc.findValidationError(validInput()), null);
  });

  it('accepts a yearly subscription with a category', () => {
    const input = validInput({ cycle: 'yearly', category: 'Cloud' });
    assert.strictEqual(calc.findValidationError(input), null);
  });

  it('rejects a non-object body', () => {
    assert.ok(calc.findValidationError(undefined));
    assert.ok(calc.findValidationError(['Netflix']));
    assert.ok(calc.findValidationError('Netflix'));
  });

  it('rejects an empty or whitespace-only name', () => {
    assert.ok(calc.findValidationError(validInput({ name: '' })));
    assert.ok(calc.findValidationError(validInput({ name: '   ' })));
  });

  it('rejects a numeric name', () => {
    assert.ok(calc.findValidationError(validInput({ name: 42 })));
  });

  it('rejects a name longer than 100 characters', () => {
    assert.ok(calc.findValidationError(validInput({ name: 'a'.repeat(101) })));
  });

  it('accepts a name of exactly 100 characters', () => {
    assert.strictEqual(calc.findValidationError(validInput({ name: 'a'.repeat(100) })), null);
  });

  it('rejects a cost of zero or less', () => {
    assert.ok(calc.findValidationError(validInput({ cost: 0 })));
    assert.ok(calc.findValidationError(validInput({ cost: -5 })));
  });

  it('rejects a cost sent as a string or a non-finite number', () => {
    assert.ok(calc.findValidationError(validInput({ cost: '199' })));
    assert.ok(calc.findValidationError(validInput({ cost: Infinity })));
    assert.ok(calc.findValidationError(validInput({ cost: NaN })));
  });

  it('rejects a cycle other than monthly or yearly', () => {
    assert.ok(calc.findValidationError(validInput({ cycle: 'weekly' })));
    assert.ok(calc.findValidationError(validInput({ cycle: 'Monthly' })));
    assert.ok(calc.findValidationError(validInput({ cycle: undefined })));
  });

  it('rejects dates that are not strict YYYY-MM-DD', () => {
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026-1-5' })));
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026/01/05' })));
    assert.ok(calc.findValidationError(validInput({ renewalDate: '05-01-2026' })));
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026-01-05T00:00' })));
    assert.ok(calc.findValidationError(validInput({ renewalDate: 20260105 })));
  });

  it('rejects impossible calendar dates', () => {
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026-02-30' })));
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026-13-45' })));
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026-00-10' })));
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026-04-31' })));
  });

  it('accepts 29 February only in leap years', () => {
    assert.strictEqual(calc.findValidationError(validInput({ renewalDate: '2024-02-29' })), null);
    assert.ok(calc.findValidationError(validInput({ renewalDate: '2026-02-29' })));
  });

  it('rejects a category that is not a string', () => {
    assert.ok(calc.findValidationError(validInput({ category: 7 })));
    assert.ok(calc.findValidationError(validInput({ category: null })));
  });

  it('rejects a category longer than 50 characters', () => {
    assert.ok(calc.findValidationError(validInput({ category: 'c'.repeat(51) })));
  });
});

describe('toRecord', () => {
  it('keeps only the stored fields and trims name and category', () => {
    const record = calc.toRecord(
      validInput({ name: '  Gym  ', category: '  Health ', notes: 'ignored' })
    );
    assert.deepStrictEqual(record, {
      name: 'Gym',
      cost: 199,
      cycle: 'monthly',
      renewalDate: '2026-12-01',
      category: 'Health',
    });
  });

  it('omits category when it is empty after trimming', () => {
    const record = calc.toRecord(validInput({ category: '   ' }));
    assert.strictEqual('category' in record, false);
  });

  it('omits category when it is not provided', () => {
    const record = calc.toRecord(validInput());
    assert.strictEqual('category' in record, false);
  });
});

describe('monthlyTotal', () => {
  it('adds monthly costs and yearly costs divided by 12', () => {
    const items = [
      { cost: 199, cycle: 'monthly' },
      { cost: 1200, cycle: 'yearly' },
    ];
    assert.strictEqual(calc.monthlyTotal(items), 299);
  });

  it('returns 0 for an empty list', () => {
    assert.strictEqual(calc.monthlyTotal([]), 0);
  });

  it('does not round the yearly contribution', () => {
    const items = [{ cost: 100, cycle: 'yearly' }];
    assert.strictEqual(calc.monthlyTotal(items), 100 / 12);
  });
});

describe('nextRenewalDate', () => {
  it('keeps a renewal date that is today or in the future', () => {
    const today = localDate(2026, 11, 20);
    assert.strictEqual(calc.nextRenewalDate('2026-11-20', 'monthly', today), '2026-11-20');
    assert.strictEqual(calc.nextRenewalDate('2027-03-10', 'yearly', today), '2027-03-10');
  });

  it('rolls a past monthly date forward to the next monthly occurrence', () => {
    const today = localDate(2026, 11, 20);
    assert.strictEqual(calc.nextRenewalDate('2026-08-03', 'monthly', today), '2026-12-03');
  });

  it('rolls a past yearly date to the first anniversary on or after today', () => {
    const today = localDate(2026, 11, 20);
    assert.strictEqual(calc.nextRenewalDate('2026-09-17', 'yearly', today), '2027-09-17');
    assert.strictEqual(calc.nextRenewalDate('2025-11-20', 'yearly', today), '2026-11-20');
  });

  it('anchors on the stored date, not the previous result', () => {
    const today = localDate(2026, 3, 1);
    assert.strictEqual(calc.nextRenewalDate('2026-01-31', 'monthly', today), '2026-03-31');
  });

  it('clamps 31 January to the last day of February', () => {
    const today = localDate(2026, 2, 1);
    assert.strictEqual(calc.nextRenewalDate('2026-01-31', 'monthly', today), '2026-02-28');
  });

  it('clamps 31 January to the last day of February in a leap year', () => {
    const today = localDate(2024, 2, 1);
    assert.strictEqual(calc.nextRenewalDate('2024-01-31', 'monthly', today), '2024-02-29');
  });

  it('keeps day 30 when the target month has 30 days', () => {
    const today = localDate(2026, 12, 1);
    assert.strictEqual(calc.nextRenewalDate('2026-11-30', 'monthly', today), '2026-12-30');
  });

  it('rolls 29 February yearly to 28 February in a non-leap year', () => {
    const today = localDate(2026, 11, 20);
    assert.strictEqual(calc.nextRenewalDate('2024-02-29', 'yearly', today), '2027-02-28');
  });

  it('keeps 29 February in a leap target year after the anniversary', () => {
    const today = localDate(2026, 11, 20);
    assert.strictEqual(calc.nextRenewalDate('2024-02-29', 'yearly', today), '2027-02-28');
    assert.strictEqual(calc.nextRenewalDate('2024-02-29', 'yearly', localDate(2027, 3, 1)), '2028-02-29');
  });

  it('handles a stored date many years in the past', () => {
    const today = localDate(2026, 11, 20);
    assert.strictEqual(calc.nextRenewalDate('2010-05-05', 'monthly', today), '2026-12-05');
  });
});

describe('withNextRenewal', () => {
  it('adds nextRenewalDate to each item without changing renewalDate', () => {
    const today = localDate(2026, 11, 20);
    const items = [{ id: 'a', renewalDate: '2026-08-03', cycle: 'monthly', cost: 10 }];
    const [item] = calc.withNextRenewal(items, today);
    assert.strictEqual(item.nextRenewalDate, '2026-12-03');
    assert.strictEqual(item.renewalDate, '2026-08-03');
  });
});

describe('renewingWithin', () => {
  it('includes today and today+7 and excludes today+8', () => {
    const today = localDate(2026, 11, 20);
    const items = [
      { name: 'today', renewalDate: '2026-11-20', cycle: 'monthly', cost: 1 },
      { name: 'plus7', renewalDate: '2026-11-27', cycle: 'monthly', cost: 1 },
      { name: 'plus8', renewalDate: '2026-11-28', cycle: 'monthly', cost: 1 },
    ];
    const names = calc.renewingWithin(items, today).map((item) => item.name);
    assert.deepStrictEqual(names, ['today', 'plus7']);
  });

  it('uses the rolled-forward date when the stored date is in the past', () => {
    const today = localDate(2026, 11, 20);
    const items = [{ name: 'rolled', renewalDate: '2026-10-22', cycle: 'monthly', cost: 1 }];
    const names = calc.renewingWithin(items, today).map((item) => item.name);
    assert.deepStrictEqual(names, ['rolled']);
  });

  it('excludes past-due items whose next renewal is outside the window', () => {
    const today = localDate(2026, 11, 20);
    const items = [{ name: 'later', renewalDate: '2026-10-15', cycle: 'monthly', cost: 1 }];
    assert.deepStrictEqual(calc.renewingWithin(items, today), []);
  });

  it('returns an empty list when nothing renews soon', () => {
    const today = localDate(2026, 11, 20);
    assert.deepStrictEqual(calc.renewingWithin([], today), []);
  });
});

describe('parseIsoDate', () => {
  it('returns parts for a valid date and null for an invalid one', () => {
    assert.deepStrictEqual(calc.parseIsoDate('2026-11-20'), { year: 2026, month: 11, day: 20 });
    assert.strictEqual(calc.parseIsoDate('2026-02-30'), null);
    assert.strictEqual(calc.parseIsoDate(null), null);
  });
});
