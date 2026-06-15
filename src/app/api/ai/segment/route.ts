import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const prompt = `
    You are an expert Prisma query generator for a CRM system.
    Translate the following natural language query into a Prisma "where" object for the "Customer" model.
    
    IMPORTANT CONTEXT: Today's date is ${new Date().toISOString()}.
    When generating dates for things like "6 months ago" or "last year", calculate the date relative to TODAY.
    
    Here is the Customer schema:
    model Customer {
      id             String
      name           String
      email          String
      phone          String?
      city           String?
      totalOrders    Int
      totalSpend     Float
      lastOrderDate  DateTime?
      tags           String[] // Available tags usually include: 'VIP', 'Churn Risk', 'New', 'Frequent Buyer', 'Discount Seeker', 'Holiday Shopper'
      createdAt      DateTime
    }

    Rules:
    - Return ONLY valid JSON with a root key "where". Example: { "where": { "totalSpend": { "gte": 500 } } }
    - Be precise.
    - If the user asks for high value, assume totalSpend > 500 or totalOrders >= 3.
    - If the user asks for churn risk, maybe check lastOrderDate < 6 months ago, or tags has 'Churn Risk'.
    
    Query: "${query}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let jsonStr = response.text || '{}';
    // Clean up if it returned markdown
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json({ filterLogic: result.where || {} });
  } catch (error: any) {
    console.error('AI Segmentation Error:', error);
    return NextResponse.json({ error: 'Failed to generate segment' }, { status: 500 });
  }
}
