import { NextResponse } from 'next/server';
import { callDirectRPC } from '@/lib/server-rpc';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { method, params } = body;

        if (!method) {
            return NextResponse.json(
                { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null },
                { status: 400 }
            );
        }

        // Default to mainnet, but could be configurable
        // We try mainnet first as it has more endpoints in server-rpc.ts
        const response = await callDirectRPC(method, params, 'mainnet');

        if (!response.success) {
            // Fallback to devnet if mainnet fails entirely (though callDirectRPC has internal failover)
            const devnetResponse = await callDirectRPC(method, params, 'devnet');
            if (!devnetResponse.success) {
                return NextResponse.json({
                    jsonrpc: '2.0',
                    error: { code: -32603, message: response.error || devnetResponse.error },
                    id: body.id
                });
            }
            return NextResponse.json({
                jsonrpc: '2.0',
                result: devnetResponse.data,
                id: body.id
            });
        }

        return NextResponse.json({
            jsonrpc: '2.0',
            result: response.data,
            id: body.id
        });

    } catch (error) {
        console.error('RPC Proxy error:', error);
        return NextResponse.json(
            { jsonrpc: '2.0', error: { code: -32603, message: 'Internal Error' }, id: null },
            { status: 500 }
        );
    }
}
