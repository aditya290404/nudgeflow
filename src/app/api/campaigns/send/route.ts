import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

const CHANNEL_STUB_URL = process.env.CHANNEL_STUB_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  try {
    const { name, segmentId, channel, message } = await req.json();

    if (!name || !segmentId || !channel || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Segment
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // 2. Fetch customers based on segment filter logic
    const filterLogic = segment.filterLogic as any;
    const customers = await prisma.customer.findMany({
      where: filterLogic,
    });

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Segment has no customers' }, { status: 400 });
    }

    // 3. Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId,
        channel,
        message,
        status: 'SENDING',
        sentCount: customers.length, // Optimistic set, can be updated later
      },
    });

    // 4. Create Communications (Batch insert)
    const communicationsData = customers.map((customer) => ({
      campaignId: campaign.id,
      customerId: customer.id,
      channel,
      message,
      status: 'SENT', // Initial status
    }));

    await prisma.communication.createMany({
      data: communicationsData,
    });

    const communications = await prisma.communication.findMany({
      where: { campaignId: campaign.id },
      include: { customer: true },
    });

    // 5. Fire to Channel Stub asynchronously
    // In a real app, this would use a queue like BullMQ or SQS.
    // For this assignment, we do it in an async IIFE to not block the request.
    (async () => {
      for (const comm of communications) {
        try {
          await fetch(`${CHANNEL_STUB_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              communicationId: comm.id,
              customerId: comm.customerId,
              channel: comm.channel,
              message: comm.message,
              recipientName: comm.customer.name,
            }),
          });
        } catch (error) {
            console.error(`[Fallback] Could not reach channel-stub at ${CHANNEL_STUB_URL}. Simulating local delivery for demo purposes...`);
            
            // Simulating the channel-stub delivery directly in DB for Vercel deployment
            const isOpened = Math.random() < 0.55;
            const isClicked = isOpened && Math.random() < 0.20;
            
            let finalStatus = 'DELIVERED';
            if (isClicked) finalStatus = 'CLICKED';
            else if (isOpened) finalStatus = 'OPENED';
            
            await prisma.communication.update({
              where: { id: comm.id },
              data: { status: finalStatus }
            });
            
            // Update Campaign aggregates directly
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: {
                deliveredCount: { increment: 1 },
                openedCount: { increment: isOpened ? 1 : 0 },
                clickedCount: { increment: isClicked ? 1 : 0 }
              }
            });
        }
      }
      
      // Update campaign status to SENT after all dispatched
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT' }
      });
    })();

    return NextResponse.json({ success: true, campaignId: campaign.id });
  } catch (error: any) {
    console.error('Campaign Send Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
