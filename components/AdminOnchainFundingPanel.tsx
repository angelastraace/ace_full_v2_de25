"use client";

import React, { useState } from "react";

export default function AdminOnchainFundingPanel() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTxHash(null);

    if (!to || !amount) {
      setError("Recipient and amount are required.");
      return;
    }

    setLoading(true);
    try {
      // Call local API route which simulates sending funds / interacting with onchain logic
      const res = await fetch("/api/admin/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, amount }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to send");
      }
      const data = await res.json();
      setTxHash(data.txHash || null);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{padding:16, border:'1px solid #ddd', borderRadius:8, maxWidth:720}}>
      <h3>Admin Onchain Funding</h3>
      <form onSubmit={handleSend} style={{display:'grid', gap:8}}>
        <label>
          Recipient address
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="0x..." style={{width:'100%'}} />
        </label>
        <label>
          Amount (ETH)
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.05" style={{width:'100%'}} />
        </label>

        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button type="submit" disabled={loading} style={{padding:'8px 12px'}}>
            {loading ? "Sending..." : "Send funds"}
          </button>
          {loading && <span>⏳</span>}
          {txHash && (
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{marginLeft:12}}>
              View on Etherscan
            </a>
          )}
        </div>
      </form>
      {error && <div style={{color:'crimson', marginTop:8}}>Error: {error}</div>}
      <small style={{display:'block', marginTop:8, color:'#666'}}>This panel uses a simulated API route for testing. Replace with real signer/provider logic in production.</small>
    </div>
  );
}
