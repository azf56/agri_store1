import { sequelize, testConnection } from '../config/database.js';
import '../models/index.js';

export async function syncDatabase(options = { alter: true }): Promise<void> {
  console.log('🔄 [DB Sync] Connecting to database and syncing schemas...');
  const conn = await testConnection();
  if (!conn.success) {
    throw new Error(`Failed to connect to database: ${conn.message}`);
  }

  const dialect = sequelize.getDialect();

  if (dialect === 'sqlite') {
    // For SQLite, perform safe schema sync & column migrations
    await sequelize.sync();

    // Check and add is_active to products if missing
    try {
      const [columns] = await sequelize.query('PRAGMA table_info(products);') as [Array<{ name: string }>, any];
      const hasIsActive = columns.some((col) => col.name === 'is_active');
      if (!hasIsActive) {
        console.log('ℹ️ [DB Migration] Adding is_active column to products table...');
        await sequelize.query('ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1;');
      }
    } catch (e: any) {
      console.log('⚠️ [DB Migration note on products]:', e.message);
    }

    // Check and add role to users if missing
    try {
      const [userCols] = await sequelize.query('PRAGMA table_info(users);') as [Array<{ name: string }>, any];
      const hasRole = userCols.some((col) => col.name === 'role');
      if (!hasRole) {
        console.log('ℹ️ [DB Migration] Adding role column to users table...');
        await sequelize.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer';");
      }
    } catch (e: any) {
      console.log('⚠️ [DB Migration note on users]:', e.message);
    }
  } else {
    // For MySQL / MariaDB on cPanel / VPS
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.log('🛡️ [DB Sync] Production mode: Running safe sequelize.sync() WITHOUT alter to prevent table corruption.');
      await sequelize.sync(); // Strict without alter on production MySQL
    } else {
      await sequelize.sync(options);
    }
  }

  console.log('✅ [DB Sync] All database tables (Categories, Products, Users, Orders, OrderItems, CartItems) synchronized successfully!');
}

// Run directly if called via CLI: tsx server/scripts/syncDb.ts
if (process.argv[1]?.endsWith('syncDb.ts') || process.argv[1]?.endsWith('syncDb.js')) {
  syncDatabase({ alter: process.env.NODE_ENV !== 'production' })
    .then(() => {
      console.log('🚀 Database sync process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Database sync failed:', err);
      process.exit(1);
    });
}
