import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { convertLogicToPrismaWhere } from '@/lib/segment-parser';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // 1. Fetch Campaign and Segment
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Campaign is not in DRAFT status' }, { status: 400 });
    }

    // 2. Fetch Customers in Segment
    const where = convertLogicToPrismaWhere(campaign.segment.filterLogic);
    const customers = await prisma.customer.findMany({ where });

    if (customers.length === 0) {
      return NextResponse.json({ error: 'No customers in this segment' }, { status: 400 });
    }

    // 3. Create Communication Rows and update campaign status (Atomically using Transaction)
    // We update the status to SENDING and set the sentCount
    await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'SENDING',
          sentCount: customers.length
        }
      });

      const communicationData = customers.map(customer => ({
        campaignId,
        customerId: customer.id,
        channel: campaign.channel,
        message: campaign.message.replace('{{name}}', customer.name), // simple templating
        status: 'SENT',
      }));

      await tx.communication.createMany({
        data: communicationData
      });
    });

    // 4. Trigger Channel Stub for each communication (async)
    // Fetch newly created communications
    const communications = await prisma.communication.findMany({
      where: { campaignId },
      include: { customer: true }
    });

    const CHANNEL_STUB_URL = process.env.CHANNEL_STUB_URL || 'http://localhost:3001';

    // We do not wait for all these to finish. Fire and forget.
    communications.forEach((comm) => {
      fetch(`${CHANNEL_STUB_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communicationId: comm.id,
          customerId: comm.customerId,
          channel: comm.channel,
          message: comm.message,
          recipientName: comm.customer.name,
        })
      }).catch(err => console.error(`[Channel Stub] Failed to send to ${comm.id}:`, err.message));
    });

    return NextResponse.json({ success: true, message: `Started sending to ${customers.length} customers` });
  } catch (error) {
    console.error(`[POST /api/campaigns/send]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
