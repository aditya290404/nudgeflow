import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { communicationId, status } = await request.json();

    if (!communicationId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const communication = await prisma.communication.findUnique({
      where: { id: communicationId }
    });

    if (!communication) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    const timestampField = status === 'DELIVERED' ? 'deliveredAt'
      : status === 'OPENED' ? 'openedAt'
      : status === 'CLICKED' ? 'clickedAt'
      : null;

    const dataToUpdate: any = { status };
    if (timestampField) {
      dataToUpdate[timestampField] = new Date();
    }

    // Determine which count to increment in Campaign
    let incrementField = null;
    switch (status) {
      case 'DELIVERED': incrementField = 'deliveredCount'; break;
      case 'OPENED': incrementField = 'openedCount'; break;
      case 'CLICKED': incrementField = 'clickedCount'; break;
      case 'FAILED': incrementField = 'failedCount'; break;
    }

    await prisma.$transaction(async (tx) => {
      // Update Communication
      await tx.communication.update({
        where: { id: communicationId },
        data: dataToUpdate
      });

      // Update Campaign Counter
      if (incrementField) {
        await tx.campaign.update({
          where: { id: communication.campaignId },
          data: {
            [incrementField]: { increment: 1 }
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/receipt]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
