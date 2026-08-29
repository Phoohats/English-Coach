# Database Migration Policy

The target database is PostgreSQL. No production database is connected yet.

## Required sequence

Every breaking data change uses `Expand -> Migrate -> Contract` across separate releases.

1. Expand: add nullable columns, new tables, indexes, or compatible views. Old code must keep working.
2. Migrate: backfill in bounded batches, verify counts and invariants, and let both old and new code read safely.
3. Contract: remove obsolete structures only after telemetry proves no active code uses them.

## Rules

- Migration files are immutable after merge.
- Use `YYYYMMDDHHMM_description.sql` filenames.
- Never combine rename/drop with the application release that introduces the replacement.
- Never add a required column without a safe default or staged backfill.
- Prefer roll-forward data fixes; application rollback must remain compatible with the expanded schema.
- Test every migration on a production-shaped snapshot before release.
- Verify backup restoration before the first public pilot and after material storage changes.
- Record row counts, duration, errors, and invariant checks for each migration run.
- Destructive contract migrations require an explicit approval and a tested recovery plan.

## Pull request evidence

A database change must include:

- Forward migration.
- Compatibility explanation for the current and previous application versions.
- Backfill and restart behavior.
- Data invariant query.
- Performance impact estimate.
- Recovery or roll-forward procedure.
- Regression test proving old data remains readable.
