import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://n8n.srv846970.hstgr.cloud/webhook/canvas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'save', data: body }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `n8n error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Canvas save error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}
