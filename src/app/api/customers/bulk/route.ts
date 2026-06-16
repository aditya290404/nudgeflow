import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Expected an array of customers' }, { status: 400 });
    }

    const upserts = data.map((customerData: any) => {
      if (!customerData.email || !customerData.name) {
        return null; // Skip invalid records
      }
      
      return prisma.customer.upsert({
        where: { email: customerData.email },
        update: {
          name: customerData.name,
          phone: customerData.phone || undefined,
          city: customerData.city || undefined,
          // We don't push tags on bulk update to avoid massive duplicates unless handled carefully.
          // Or we can just set them if provided.
          ...(customerData.tags ? { tags: customerData.tags } : {}),
        },
        create: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone || null,
          city: customerData.city || null,
          tags: customerData.tags || [],
        },
      });
    }).filter(Boolean) as any;

    if (upserts.length === 0) {
      return NextResponse.json({ error: 'No valid customers found in payload' }, { status: 400 });
    }

    const results = await prisma.$transaction(upserts);

    return NextResponse.json({ success: true, count: results.length }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/customers/bulk]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
