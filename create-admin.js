/**
 * Standalone one-time cPanel terminal script to create an Admin user directly in MySQL.
 * 
 * Run from terminal via:
 *   node create-admin.js --phone 09121234567 --password admin123456 --name "مدیر فروشگاه"
 * Or:
 *   npm run create-admin
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.join(__dirname, 'server', 'scripts', 'createAdmin.ts');
const args = ['tsx', scriptPath, ...process.argv.slice(2)];

console.log('🚀 Running AgriStore Admin Setup Script...');
const child = spawn('npx', args, { stdio: 'inherit', shell: true });

child.on('close', (code) => {
  process.exit(code || 0);
});
