import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MessageDraftSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    email: { type: Type.STRING, description: 'Subject and body for an email campaign' },
    sms: { type: Type.STRING, description: 'Short and punchy text for SMS' },
    whatsapp: { type: Type.STRING, description: 'Slightly longer, conversational message for WhatsApp' },
  },
  required: ['email', 'sms', 'whatsapp'],
};

export async function POST(req: NextRequest) {
  try {
    const { segmentName, tone, extraContext } = await req.json();

    if (!segmentName || !tone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `
    You are an expert copywriter for a top-tier Direct-to-Consumer brand.
    Draft 3 messages (Email, SMS, WhatsApp) for a marketing campaign.
    
    Target Segment Name/Description: "${segmentName}"
    Desired Tone: "${tone}"
    Extra Context/Offer: "${extraContext || 'None provided. Focus on engagement.'}"

    Rules:
    - The email should have a catchy Subject line followed by the body.
    - SMS should be under 160 characters.
    - WhatsApp can be conversational, use emojis, and be slightly longer than SMS.
    - Personalize where appropriate (use {{name}} as a placeholder).
    - Return ONLY valid JSON with 'email', 'sms', and 'whatsapp' keys.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: MessageDraftSchema,
      },
    });

    let jsonStr = response.text || '{}';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Drafting Error:', error);
    return NextResponse.json({ error: 'Failed to draft messages' }, { status: 500 });
  }
}
