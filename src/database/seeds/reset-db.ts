import { DataSource } from 'typeorm';
import dataSource from '../data-source';

async function resetDatabase() {
  try {
    console.log('🔄 در حال پاکسازی دیتابیس...');
    await dataSource.initialize();

    // پاک کردن همه جداول (مراقب باش! این کار همه داده‌ها رو پاک می‌کنه)
    await dataSource.query(`
      TRUNCATE TABLE 
        "admins", 
        "roles", 
        "permissions", 
        "role_permissions" 
      CASCADE;
    `);

    console.log('✅ دیتابیس پاکسازی شد');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

resetDatabase();