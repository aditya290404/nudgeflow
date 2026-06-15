import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const communications = await prisma.communication.findMany({
      where: { campaignId },
      include: {
        customer: true
      },
      orderBy: { sentAt: 'desc' }
    });
    return NextResponse.json(communications);
  } catch (error) {
    console.error(`[GET /api/campaigns/communications]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
