import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import dataSource from '../src/database/data-source';
import { InitialSeed } from '../src/database/seeds/initial.seed';
import { Admins } from '../src/entities/admins.entity';
import { Role } from '../src/entities/role.entity';

config();

const email = process.env.ADMIN_EMAIL || 'adminpalette@palette.local';
const password = process.env.ADMIN_PASSWORD || 'adPalette.404';
const name = process.env.ADMIN_NAME || 'Admin Palette';

async function main() {
  await dataSource.initialize();

  const roleCount = await dataSource.getRepository(Role).count();
  if (roleCount === 0) {
    console.log('Database empty — running initial seed (roles, permissions)...');
    await new InitialSeed().run(dataSource);
  }

  const managerRole = await dataSource.getRepository(Role).findOne({
    where: { name: 'manager' },
  });

  if (!managerRole) {
    throw new Error('Manager role not found after seeding');
  }

  const adminRepository = dataSource.getRepository(Admins);
  const passwordHash = await bcrypt.hash(password, 10);

  let admin = await adminRepository.findOne({ where: { email } });

  if (admin) {
    admin.passwordHash = passwordHash;
    admin.isActive = true;
    admin.roleId = managerRole.id;
    admin.roleName = managerRole.name;
    admin.name = name;
    await adminRepository.save(admin);
    console.log('Updated existing admin.');
  } else {
    admin = adminRepository.create({
      email,
      passwordHash,
      name,
      roleId: managerRole.id,
      roleName: managerRole.name,
      isActive: true,
    });
    await adminRepository.save(admin);
    console.log('Created new admin.');
  }

  console.log('');
  console.log('Login credentials:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);

  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Failed to create admin:', error);
  process.exit(1);
});
