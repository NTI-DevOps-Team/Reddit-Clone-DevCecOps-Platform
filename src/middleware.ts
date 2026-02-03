import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const start = Date.now();

    // Clone the request headers and add start time
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-start', start.toString());

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Add response time header
    const duration = Date.now() - start;
    response.headers.set('x-response-time', `${duration}ms`);

    return response;
}

// Apply middleware to API routes only
export const config = {
    matcher: '/api/:path*',
};
