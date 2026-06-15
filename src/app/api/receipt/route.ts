import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { communicationId, status } = await req.json();

    if (!communicationId || !status) {
      return NextResponse.json({ error: 'Missing communicationId or status' }, { status: 400 });
    }

    // Determine the field to update on Campaign and Communication based on status
    let updateData: any = { status };
    let campaignIncrement: any = {};

    switch (status) {
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        campaignIncrement.deliveredCount = { increment: 1 };
        break;
      case 'OPENED':
        updateData.openedAt = new Date();
        campaignIncrement.openedCount = { increment: 1 };
        break;
      case 'CLICKED':
        updateData.clickedAt = new Date();
        campaignIncrement.clickedCount = { increment: 1 };
        break;
      case 'FAILED':
        campaignIncrement.failedCount = { increment: 1 };
        break;
      default:
        // Ignore unrecognized statuses to prevent errors
        break;
    }

    // 1. Fetch current communication to get the campaignId
    const comm = await prisma.communication.findUnique({
      where: { id: communicationId },
      select: { campaignId: true, status: true },
    });

    if (!comm) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    // 2. Perform Atomic Update using Prisma's Transaction
    // We update the Communication row, and atomically increment the parent Campaign stats.
    await prisma.$transaction([
      prisma.communication.update({
        where: { id: communicationId },
        data: updateData,
      }),
      prisma.campaign.update({
        where: { id: comm.campaignId },
        data: campaignIncrement,
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Receipt Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
