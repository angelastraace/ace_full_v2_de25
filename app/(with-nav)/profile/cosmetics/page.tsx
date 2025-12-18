"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Skin = {
  id: string;
  name: string;
  category: string;
  metadata: any;
};

export default function CosmeticsPage() {
  const [skins, setSkins] = useState<Skin[]>([]);

  async function load() {
    const r = await fetch("/api/cosmetics/available");
    const j = await r.json();
    setSkins(j.skins ?? []);
  }

  async function select(category: string, skin_id: string) {
    await fetch("/api/cosmetics/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, skin_id }),
    });
    load();
  }

  useEffect(() => { load(); }, []);

  const byCat = skins.reduce((a: any, s) => {
    (a[s.category] ||= []).push(s);
    return a;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cosmetics</h1>

      {Object.entries(byCat).map(([cat, list]: any) => (
        <Card key={cat}>
          <CardHeader>
            <CardTitle className="capitalize">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            {list.map((s: Skin) => (
              <Button key={s.id} onClick={() => select(cat, s.id)}>
                {s.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
