import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        segment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('[GET /api/campaigns]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, segmentId, message, channel } = body;

    if (!name || !segmentId || !message || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId,
        message,
        channel,
        status: 'DRAFT',
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[POST /api/campaigns]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
