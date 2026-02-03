import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

// We'll import these after creating the metrics file
let apiRequestsTotal: any;
let apiRequestDuration: any;

// Dynamic import to avoid circular dependency
const getMetrics = async () => {
    if (!apiRequestsTotal || !apiRequestDuration) {
        const metrics = await import('../pages/api/metrics');
        apiRequestsTotal = metrics.apiRequestsTotal;
        apiRequestDuration = metrics.apiRequestDuration;
    }
    return { apiRequestsTotal, apiRequestDuration };
};

export function withMetrics(handler: NextApiHandler) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const start = Date.now();
        const route = req.url || 'unknown';
        const method = req.method || 'GET';

        // Track original methods
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        const originalEnd = res.end.bind(res);

        let statusCode = 200;
        let metricsRecorded = false;

        const recordMetrics = async () => {
            if (metricsRecorded) return;
            metricsRecorded = true;

            try {
                const { apiRequestsTotal, apiRequestDuration } = await getMetrics();
                const duration = (Date.now() - start) / 1000;
                const status = statusCode.toString();

                apiRequestsTotal.inc({ method, route, status });
                apiRequestDuration.observe({ method, route, status }, duration);
            } catch (error) {
                console.error('Failed to record metrics:', error);
            }
        };

        // Override response methods
        res.json = function (body: any) {
            statusCode = res.statusCode || 200;
            recordMetrics();
            return originalJson(body);
        };

        res.send = function (body: any) {
            statusCode = res.statusCode || 200;
            recordMetrics();
            return originalSend(body);
        };

        res.end = function (...args: any[]) {
            statusCode = res.statusCode || 200;
            recordMetrics();
            return originalEnd(...args);
        };

        try {
            await handler(req, res);
        } catch (error) {
            statusCode = 500;
            await recordMetrics();
            throw error;
        }
    };
}
