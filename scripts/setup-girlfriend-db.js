import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupGirlfriendDatabase() {
  console.log('Setting up girlfriend\'s database...');
  
  // Create a new Prisma client for the girlfriend's database
  const girlfriendDb = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./db_girlfriend.sqlite',
      },
    },
  });

  try {
    // Run migrations on the girlfriend's database
    console.log('Running migrations on girlfriend\'s database...');
    
    // Create the database file if it doesn't exist
    const dbPath = path.join(process.cwd(), 'db_girlfriend.sqlite');
    if (!fs.existsSync(dbPath)) {
      console.log('Creating girlfriend\'s database file...');
      fs.writeFileSync(dbPath, '');
    }

    // Push the schema to the girlfriend's database
    execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: 'file:./db_girlfriend.sqlite' },
      stdio: 'inherit'
    });

    console.log('✅ Girlfriend\'s database setup complete!');
    console.log('📁 Database file: db_girlfriend.sqlite');
    console.log('💡 You can now switch between budgets using the BudgetSwitcher component');
    
  } catch (error) {
    console.error('❌ Error setting up girlfriend\'s database:', error);
  } finally {
    await girlfriendDb.$disconnect();
  }
}

setupGirlfriendDatabase(); 