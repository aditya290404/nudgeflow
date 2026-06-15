import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { segmentDescription, channel } = await request.json();

    if (!segmentDescription || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = `
You are an expert D2C marketer drafting a short, engaging campaign message for a fashion/beauty brand called "NudgeFlow".
The target audience is described as: "${segmentDescription}".
The channel is: ${channel.toUpperCase()}.

Rules:
1. Write ONLY the message content. No preamble, no explanation.
2. Keep it concise, punchy, and appropriate for the channel.
   - SMS/WhatsApp: Short, uses emojis, strong CTA, max 160-200 characters.
   - Email: Engaging subject line (first line), then body, slightly longer.
3. You can use the variable "{{name}}" where appropriate.
4. Tone should be premium, inviting, and urgent if it involves an offer.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Draft a message for this segment: ${segmentDescription} on channel: ${channel}`,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
        }
    });

    const draft = response.text || '';

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('[POST /api/ai/draft-message]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
