import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { InitialSeed } from './initial.seed';
import dataSource from '../data-source';

config();

async function runSeeds() {
  try {
    console.log('🚀 start seeding...');
    
    // اتصال به دیتابیس
    await dataSource.initialize();
    console.log('✅ connect to db');

    // اجرای seed
    const seed = new InitialSeed();
    await seed.run(dataSource);

    console.log('✨ Seeding completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ seeding error', error);
    process.exit(1);
  }
}

runSeeds();