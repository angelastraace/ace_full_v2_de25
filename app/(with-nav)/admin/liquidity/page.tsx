// app/admin/liquidity/page.tsx
'use client';
import { useState } from 'react';

export default function AdminLiquidityPage() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  async function handleAddLiquidity() {
    setLoading(true);
    setLog(null);
    try {
      const res = await fetch('/api/admin/liquidity', { method: 'POST' });
      const text = await res.text();
      setLog(text);
    } catch (err: any) {
      setLog(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Liquidity Console</h1>

      <p className="mb-4">
        This UI triggers server-side liquidity logic. Private keys never leave the server.
      </p>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleAddLiquidity}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run add liquidity script'}
      </button>

      <div className="mt-4">
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">{log ?? 'No output yet.'}</pre>
      </div>
    </div>
  );
}
