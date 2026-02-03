import { NextApiRequest, NextApiResponse } from 'next';
import client from 'prom-client';

// Create a custom registry to avoid conflicts
const register = new client.Registry();

// Collect default metrics (CPU & Memory)
client.collectDefaultMetrics({
    register,
    prefix: 'nodejs_',
});

// Custom metrics for API requests
const apiRequestsTotal = new client.Counter({
    name: 'api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

const apiRequestDuration = new client.Histogram({
    name: 'api_request_duration_seconds',
    help: 'API request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
    registers: [register],
});

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'status'],
    registers: [register],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // Increment request counter
            httpRequestsTotal.inc({
                method: req.method,
                status: '200'
            });

            res.setHeader('Content-Type', register.contentType);
            const metrics = await register.metrics();
            res.status(200).send(metrics);
        } catch (error) {
            console.error('Error generating metrics:', error);
            res.status(500).json({ error: 'Failed to generate metrics' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

// Export for use in middleware
export { apiRequestsTotal, apiRequestDuration, httpRequestsTotal, register };