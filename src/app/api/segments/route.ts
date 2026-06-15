import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(segments);
  } catch (error) {
    console.error('[GET /api/segments]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, naturalLanguageQuery, filterLogic } = body;

    if (!name || !filterLogic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Evaluate customer count dynamically directly using the filter logic as the 'where' clause
    const customerCount = await prisma.customer.count({ where: filterLogic as any });

    const segment = await prisma.segment.create({
      data: {
        name,
        naturalLanguageQuery,
        filterLogic,
        customerCount,
      }
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error('[POST /api/segments]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
