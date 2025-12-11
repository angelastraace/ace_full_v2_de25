import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).send('Method not allowed');
  }
  const { to, amount } = req.body || {};
  if (!to || !amount) return res.status(400).send('Missing to or amount');
  // Simulate sending and return a fake tx hash for testing
  const fakeHash = '0x' + Math.random().toString(16).slice(2, 62).padEnd(64, '0').slice(0,64);
  // small delay to simulate network
  await new Promise(r => setTimeout(r, 800));
  return res.status(200).json({ txHash: fakeHash });
}
