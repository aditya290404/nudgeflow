import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Alternatively, we could import the logic here, but since the seed script is already written in prisma/seed.ts, 
    // we can use the Prisma seed command if configured in package.json, or execute the tsx/ts-node directly.
    // For Vercel deployment this wouldn't work easily, but for local Day 1, it's acceptable.
    // Better yet, just return a message saying to run `npm run seed` if it's too complex to run in Next.js edge.
    // Wait, let's just implement a simple execute or tell them. The instructions say "seed 300 realistic fake customers".
    // Let's use `exec` to run `npx prisma db seed` assuming we add it to package.json.
    
    // Actually, running `npx tsx prisma/seed.ts` is more reliable locally.
    await execAsync('npx tsx prisma/seed.ts');
    
    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error('[POST /api/customers/seed]', error);
    return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
  }
}
