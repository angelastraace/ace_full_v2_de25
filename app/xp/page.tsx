import dynamic from 'next/dynamic';
import XPConstellationDemo from '../../components/XPConstellationDemo';
import { useEffect, useState } from 'react';

export default function XPPage() {
  const [xp, setXp] = useState(0);
  useEffect(()=>{
    async function load(){ try{ const res = await fetch('/api/user_xp'); const d = await res.json(); setXp(d.xp || 0);}catch(e){} }
    load();
  },[]);
  return (
    <main style={{padding:20}}>
      <h1>XP</h1>
      <XPConstellationDemo xp={xp} />
    </main>
  )
}
