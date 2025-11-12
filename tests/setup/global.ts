import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('🚀 Running migrations via sequelize-cli...');
  execSync('npx sequelize-cli db:migrate --env test', { stdio: 'inherit' });
}
