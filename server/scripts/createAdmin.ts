import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { testConnection } from '../config/database.js';
import { User } from '../models/index.js';

dotenv.config();

/**
 * Standalone one-time cPanel terminal script to create or promote an Admin user.
 * 
 * Usage:
 *   npx tsx server/scripts/createAdmin.ts --phone 09120000000 --password MySecret123 --name "مدیر ارشد"
 * Or via npm:
 *   npm run create-admin -- --phone 09120000000 --password MySecret123 --name "مدیر ارشد"
 */
export async function createAdminUser(options?: {
  phone?: string;
  password?: string;
  name?: string;
  location?: string;
}) {
  console.log('🛡️ [Create-Admin Script] Running Admin Account Creation...');

  // Parse command line arguments if not provided in options
  const args = process.argv.slice(2);
  let phone = options?.phone || process.env.ADMIN_PHONE || '';
  let password = options?.password || process.env.ADMIN_PASSWORD || '';
  let name = options?.name || process.env.ADMIN_NAME || 'مدیر ارشد سامانه نهاده‌های کشاورزی';
  let location = options?.location || process.env.ADMIN_LOCATION || 'دفتر مرکزی تهران / استان البرز';

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--phone' || args[i] === '-p') && args[i + 1]) {
      phone = args[i + 1];
      i++;
    } else if ((args[i] === '--password' || args[i] === '-pwd') && args[i + 1]) {
      password = args[i + 1];
      i++;
    } else if ((args[i] === '--name' || args[i] === '-n') && args[i + 1]) {
      name = args[i + 1];
      i++;
    } else if ((args[i] === '--location' || args[i] === '-l') && args[i + 1]) {
      location = args[i + 1];
      i++;
    }
  }

  if (!phone || !password) {
    console.error('\n❌ [Security Error] Phone number and password are required to create an administrator.');
    console.error('❌ Usage with CLI arguments:');
    console.error('   node create-admin.js --phone 0912XXXXXXX --password YOUR_SECURE_PASSWORD --name "نام مدیر"');
    console.error('❌ Or via environment variables:');
    console.error('   ADMIN_PHONE=0912XXXXXXX ADMIN_PASSWORD=YOUR_PASSWORD node create-admin.js\n');
    throw new Error('Missing required admin parameters: --phone and --password must be explicitly provided.');
  }

  await testConnection();

  const existingUser = await User.findOne({ where: { phone_number: phone } });
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  if (existingUser) {
    console.log(`ℹ️ [Create-Admin] User with phone ${phone} already exists. Promoting role to 'admin' and updating password...`);
    existingUser.role = 'admin';
    existingUser.password_hash = passwordHash;
    existingUser.full_name = name;
    if (location) existingUser.farm_location = location;
    await existingUser.save();

    console.log('====================================================');
    console.log('✅ [SUCCESS] Admin user successfully updated in MySQL database:');
    console.log(`   - ID: ${existingUser.id}`);
    console.log(`   - Phone Number: ${existingUser.phone_number}`);
    console.log(`   - Full Name: ${existingUser.full_name}`);
    console.log(`   - Role: ${existingUser.role} (ADMIN)`);
    console.log('====================================================');
    return existingUser;
  } else {
    console.log(`ℹ️ [Create-Admin] Creating new administrator with phone ${phone}...`);
    const newAdmin = await User.create({
      phone_number: phone,
      password_hash: passwordHash,
      full_name: name,
      farm_location: location,
      role: 'admin',
    });

    console.log('====================================================');
    console.log('✅ [SUCCESS] New Admin user successfully created in MySQL database:');
    console.log(`   - ID: ${newAdmin.id}`);
    console.log(`   - Phone Number: ${newAdmin.phone_number}`);
    console.log(`   - Full Name: ${newAdmin.full_name}`);
    console.log(`   - Role: ${newAdmin.role} (ADMIN)`);
    console.log('====================================================');
    return newAdmin;
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1]?.includes('createAdmin') || process.argv[1]?.includes('create-admin')) {
  createAdminUser()
    .then(() => {
      console.log('🔒 Security Notice: Do not expose admin creation endpoints via public HTTP routes.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to create admin user:', err);
      process.exit(1);
    });
}
