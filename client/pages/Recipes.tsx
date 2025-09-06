import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Recipes(){
  const [query, setQuery] = useState("high protein, easy to digest");
  const [cards, setCards] = useState<{title:string; kcal:number; tags:string[]; steps:string[]}[]>([]);

  const generate = () => {
    setCards([
      { title:"Moong Oats Khichdi", kcal:420, tags:["Sattvic","Light","Warm"], steps:["Rinse moong & oats","Cook with cumin, ginger","Finish with ghee"] },
      { title:"Spiced Millet Bowl", kcal:460, tags:["Warm","Grounding"], steps:["Cook millet","Saute veg with spices","Combine & serve"] },
    ]);
  };

  const exportText = (card: {title:string; steps:string[]}) => {
    const blob = new Blob([`${card.title}\n\n${card.steps.map((s,i)=>`${i+1}. ${s}`).join("\n")}`],{type:"text/plain"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download=`${card.title}.txt`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Recipe Generator</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Ingredients or constraints" />
          <Button onClick={generate}>Generate</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c,i)=> (
          <Card key={i} className="overflow-hidden">
            <img src="/placeholder.svg" alt="recipe" className="h-36 w-full object-cover" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{c.title}</div>
                  <div className="text-xs text-muted-foreground">Approx {c.kcal} kcal</div>
                </div>
                <div className="flex gap-1">{c.tags.map((t,j)=>(<Badge key={j} variant="secondary">{t}</Badge>))}</div>
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                {c.steps.map((s,j)=>(<li key={j}>{s}</li>))}
              </ol>
              <Button className="mt-3" variant="outline" onClick={()=>exportText(c)}>Export (mock)</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
