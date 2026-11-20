# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Single-user subscription tracker web app with Express server and vanilla HTML/JS frontend
- Add, view, and delete subscriptions with name, cost (INR), billing cycle (monthly/yearly), renewal date, and optional category
- Automatic renewal date roll-forward when stored date is in the past
- Monthly spend total calculation (yearly cost divided by 12)
- Renewing-soon alert showing subscriptions renewing within 7 days (includes today, excludes today+8)
- JSON file storage under `data/subscriptions.json` with automatic file creation and corrupt file recovery
- Full test suite: 70 tests (20 API, 37 calc, 13 store) with zero vulnerabilities
- Input validation: non-empty name, cost > 0, cycle monthly/yearly, valid ISO date, name <= 100 chars, category <= 50 chars
- Notes field rejection: sent notes in requests are dropped and not stored
- Leap year handling for renewal date calculations
- Concurrent write safety via file locking
- `.gitignore` excludes `.env` and `data/` directory
