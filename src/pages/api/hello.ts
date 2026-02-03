// src/pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { withMetrics } from '@/lib/withMetrics';

type Data = {
  name: string
}

function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ name: 'Reddit Clone' })
}

export default withMetrics(handler);