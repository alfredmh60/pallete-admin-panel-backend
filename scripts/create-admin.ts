import { config } from 'dotenv';
import dataSource from '../src/database/data-source';
import { InitialSeed } from '../src/database/seeds/initial.seed';
import { Admins } from '../src/entities/admins.entity';
import { Role } from '../src/entities/role.entity';
import { normalizeIranianMobile } from '../src/utils/iranian-phone.util';

config();

const phone = normalizeIranianMobile(process.env.ADMIN_PHONE || '09127840027');
const email = process.env.ADMIN_EMAIL || 'adminpalette@palette.local';
const name = process.env.ADMIN_NAME || 'Admin Palette';

async function main() {
  if (!phone) {
    throw new Error('ADMIN_PHONE must be a valid Iranian mobile number (e.g. 09120000000)');
  }

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

  let admin = await adminRepository.findOne({ where: { phone } });

  if (!admin && email) {
    admin = await adminRepository.findOne({ where: { email } });
  }

  if (admin) {
    admin.phone = phone;
    admin.email = email;
    admin.isActive = true;
    admin.roleId = managerRole.id;
    admin.roleName = managerRole.name;
    admin.name = name;
    await adminRepository.save(admin);
    console.log('Updated existing admin.');
  } else {
    admin = adminRepository.create({
      phone,
      email,
      name,
      roleId: managerRole.id,
      roleName: managerRole.name,
      isActive: true,
    });
    await adminRepository.save(admin);
    console.log('Created new admin.');
  }

  console.log('');
  console.log('Login with OTP:');
  console.log(`  Phone: ${phone}`);
  if (email) {
    console.log(`  Email: ${email} (optional)`);
  }

  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Failed to create admin:', error);
  process.exit(1);
});
