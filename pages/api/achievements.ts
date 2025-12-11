import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return a small sample achievements list for dev/testing
  const achievements = [
    { id: 'ach-1', title: 'First Steps', description: 'Create an account', xp: 10, unlockedAt: null },
    { id: 'ach-2', title: 'Kudos', description: 'Complete first trade', xp: 25, unlockedAt: null },
    { id: 'ach-3', title: 'Explorer', description: 'Visit Dreamstate', xp: 15, unlockedAt: null },
  ];
  res.status(200).json({ achievements });
}
