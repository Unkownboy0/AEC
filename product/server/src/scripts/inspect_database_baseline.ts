import { prisma } from '../lib/prisma';

async function main() {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE 'iqac_%' OR table_name IN ('timetable_slots', '_prisma_migrations'))
    ORDER BY table_name
  `;

  let migrations: unknown;
  try {
    migrations = await prisma.$queryRaw<Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY started_at
    `;
  } catch (error) {
    migrations = [{ metadataError: error instanceof Error ? error.message : String(error) }];
  }

  const requiredForeignKeyTargets = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'users', 'departments', 'academic_years', 'semesters',
        'sections', 'subjects', 'faculties'
      )
    ORDER BY table_name
  `;

  console.log(JSON.stringify({ tables, migrations, requiredForeignKeyTargets }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
