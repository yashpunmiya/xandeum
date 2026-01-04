import { NextResponse } from 'next/server';

const POD_CREDITS_URL = 'https://podcredits.xandeum.network/api/pods-credits';

export async function GET() {
    try {
        const response = await fetch(POD_CREDITS_URL, {
            next: { revalidate: 60 },
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Upstream API error: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, max-age=60',
                'Access-Control-Allow-Origin': '*'
            },
        });
    } catch (error) {
        console.error('Pod Credits Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pod credits' },
            { status: 500 }
        );
    }
}
