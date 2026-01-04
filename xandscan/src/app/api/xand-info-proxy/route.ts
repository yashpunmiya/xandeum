import { NextResponse } from 'next/server';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/xandeum?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false';
// Using public API if no key provided

export async function GET() {
    try {
        const response = await fetch(COINGECKO_API_URL, {
            next: { revalidate: 300 }, // 5 minutes
        });

        if (!response.ok) {
            // Fallback mock data if API limits hit (common with public CoinGecko)
            console.error(`CoinGecko API error: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch XAND info' }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'public, max-age=300' },
        });
    } catch (error) {
        console.error('XAND Info API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch XAND info' },
            { status: 500 }
        );
    }
}
