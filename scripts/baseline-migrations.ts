import dataSource from '../src/database/data-source';

/**
 * Marks InitDatabase as applied when the schema was created via TypeORM synchronize.
 * Run once before `npm run migration:run` on existing dev databases.
 */
async function baselineMigrations() {
  await dataSource.initialize();

  const existing = await dataSource.query(
  `SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admins'`,
  );

  if (existing[0]?.count !== 1) {
    throw new Error('admins table not found — run InitDatabase migration instead of baselining.');
  }

  await dataSource.query(`
    INSERT INTO "migrations" ("timestamp", "name")
    SELECT 1772012274657, 'InitDatabase1772012274657'
    WHERE NOT EXISTS (
      SELECT 1 FROM "migrations" WHERE "name" = 'InitDatabase1772012274657'
    )
  `);

  console.log('Baseline complete: InitDatabase1772012274657 recorded if missing.');
  await dataSource.destroy();
}

baselineMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
