import { fileURLToPath } from 'url';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const EMAIL = 'harsh710patel@gmail.com';

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // Mute stdout while typing
      (rl as any).stdoutMuted = true;
      (rl as any)._writeToOutput = (s: string) => {
        if (s === question) process.stdout.write(s);
        else process.stdout.write('*');
      };
    }
    rl.question(question, (answer) => {
      if (hidden) process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('❌ MONGODB_URI not set in server/.env'); process.exit(1); }

  const password = await prompt('New password (min 8 chars): ', true);
  if (password.length < 8) { console.error('❌ Password must be at least 8 characters'); process.exit(1); }

  const confirm = await prompt('Confirm password: ', true);
  if (password !== confirm) { console.error('❌ Passwords do not match'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const hash = await bcrypt.hash(password, 12);
  const result = await mongoose.connection.collection('users').updateOne(
    { email: EMAIL },
    { $set: { password: hash } }
  );

  if (result.matchedCount === 0) {
    console.error(`❌ No user found with email: ${EMAIL}`);
  } else {
    console.log(`✅ Password updated for ${EMAIL}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
