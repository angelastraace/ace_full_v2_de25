import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return a simple XP summary
  res.status(200).json({ xp: 123, level: 4 });
}
