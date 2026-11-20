'use strict';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAME_MAX_LENGTH = 100;
const CATEGORY_MAX_LENGTH = 50;
const CYCLES = ['monthly', 'yearly'];
const MONTHS_PER_CYCLE = { monthly: 1, yearly: 12 };
const RENEWING_SOON_DAYS = 7;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function parseIsoDate(text) {
  if (typeof text !== 'string' || !ISO_DATE_PATTERN.test(text)) {
    return null;
  }
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

function dayKey({ year, month, day }) {
  return year * 10000 + month * 100 + day;
}

function partsOfDate(date) {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

function formatIsoDate({ year, month, day }) {
  const pad = (value, width) => String(value).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function addMonths(anchor, months) {
  const monthIndex = anchor.year * 12 + (anchor.month - 1) + months;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  const day = Math.min(anchor.day, daysInMonth(year, month));
  return { year, month, day };
}

function addDays(parts, days) {
  return partsOfDate(new Date(parts.year, parts.month - 1, parts.day + days));
}

function findNameError(name) {
  if (typeof name !== 'string') {
    return 'name must be a string';
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'name must not be empty';
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `name must be at most ${NAME_MAX_LENGTH} characters`;
  }
  return null;
}

function findCostError(cost) {
  if (typeof cost !== 'number' || !Number.isFinite(cost)) {
    return 'cost must be a number';
  }
  if (cost <= 0) {
    return 'cost must be greater than 0';
  }
  return null;
}

function findCycleError(cycle) {
  if (!CYCLES.includes(cycle)) {
    return 'cycle must be "monthly" or "yearly"';
  }
  return null;
}

function findRenewalDateError(renewalDate) {
  if (parseIsoDate(renewalDate) === null) {
    return 'renewalDate must be a valid date in YYYY-MM-DD format';
  }
  return null;
}

function findCategoryError(category) {
  if (category === undefined) {
    return null;
  }
  if (typeof category !== 'string') {
    return 'category must be a string';
  }
  if (category.trim().length > CATEGORY_MAX_LENGTH) {
    return `category must be at most ${CATEGORY_MAX_LENGTH} characters`;
  }
  return null;
}

function findValidationError(input) {
  if (!isPlainObject(input)) {
    return 'request body must be a JSON object';
  }
  return (
    findNameError(input.name) ||
    findCostError(input.cost) ||
    findCycleError(input.cycle) ||
    findRenewalDateError(input.renewalDate) ||
    findCategoryError(input.category) ||
    null
  );
}

function toRecord(input) {
  const record = {
    name: input.name.trim(),
    cost: input.cost,
    cycle: input.cycle,
    renewalDate: input.renewalDate,
  };
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  if (category.length > 0) {
    record.category = category;
  }
  return record;
}

function nextRenewalDate(renewalDate, cycle, today) {
  const anchor = parseIsoDate(renewalDate);
  const step = MONTHS_PER_CYCLE[cycle];
  const todayKey = dayKey(partsOfDate(today));
  let periods = 0;
  while (dayKey(addMonths(anchor, periods * step)) < todayKey) {
    periods += 1;
  }
  return formatIsoDate(addMonths(anchor, periods * step));
}

function withNextRenewal(items, today) {
  return items.map((item) => ({
    ...item,
    nextRenewalDate: nextRenewalDate(item.renewalDate, item.cycle, today),
  }));
}

function monthlyContribution(item) {
  return item.cycle === 'yearly' ? item.cost / 12 : item.cost;
}

function monthlyTotal(items) {
  return items.reduce((sum, item) => sum + monthlyContribution(item), 0);
}

function renewingWithin(items, today, days = RENEWING_SOON_DAYS) {
  const todayParts = partsOfDate(today);
  const startKey = dayKey(todayParts);
  const endKey = dayKey(addDays(todayParts, days));
  return withNextRenewal(items, today).filter((item) => {
    const key = dayKey(parseIsoDate(item.nextRenewalDate));
    return key >= startKey && key <= endKey;
  });
}

module.exports = {
  findValidationError,
  toRecord,
  nextRenewalDate,
  withNextRenewal,
  monthlyTotal,
  renewingWithin,
  parseIsoDate,
};
