import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://n8n.srv846970.hstgr.cloud/webhook/canvas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Drawing ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'load', data: { id } }),
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
    console.error('Canvas load error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Load failed' },
      { status: 500 }
    );
  }
}
