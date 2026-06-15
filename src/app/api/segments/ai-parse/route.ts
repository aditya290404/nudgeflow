import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import prisma from '@/lib/prisma';
import { convertLogicToPrismaWhere } from '@/lib/segment-parser';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const systemPrompt = `
You are an AI assistant that converts natural language queries into a JSON filter object for a Prisma ORM backend.
The database has a Customer model with these fields:
- totalSpend (Float)
- totalOrders (Int)
- lastOrderDate (DateTime)
- tags (String[])
- city (String)

Return ONLY a valid JSON object representing the filter logic. Do not include markdown code blocks or explanations.

Supported JSON keys and Prisma operators:
- totalSpend: { gt: number, gte: number, lt: number, lte: number }
- totalOrders: { gt: number, gte: number, lt: number, lte: number }
- lastOrderDate: { gt: "ISO-8601-date", lt: "ISO-8601-date" }
- tags: { has: "tag-name" }
- city: { equals: "CityName", mode: "insensitive" }

Example 1: "Customers who spent over ₹10,000 in the last 3 months"
{
  "totalSpend": { "gt": 10000 },
  "lastOrderDate": { "gt": "2023-03-01T00:00:00.000Z" } // calculate date 3 months ago relative to today
}

Calculate relative dates based on today's date: ${new Date().toISOString()}
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0,
        }
    });

    const responseText = response.text || '{}';
    // Clean markdown if Gemini accidentally included it
    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let filterLogic;
    try {
      filterLogic = JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse Gemini output as JSON:', cleanText);
      return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
    }

    // Evaluate customer count
    const where = convertLogicToPrismaWhere(filterLogic);
    const customerCount = await prisma.customer.count({ where });

    return NextResponse.json({ filterLogic, customerCount });
  } catch (error) {
    console.error('[POST /api/segments/ai-parse]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
