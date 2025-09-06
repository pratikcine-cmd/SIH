import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { useAppState } from "@/context/app-state";

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem("app:chatOpen") === "1"; } catch { return false; }
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string; ts: number }[]>([
    { role: "bot", text: "Hi! I'm your Ayurvedic assistant. Tell me what you ate or ask for tips.", ts: Date.now() },
  ]);
  const { markMealTaken, updateWater } = useAppState();
  const [uploadName, setUploadName] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef<{dx:number; dy:number}>({ dx: 0, dy: 0 });
  const [pos, setPos] = useState<{x:number; y:number}>(() => {
    try {
      const x = parseInt(localStorage.getItem("app:chat:x") || "");
      const y = parseInt(localStorage.getItem("app:chat:y") || "");
      if (!Number.isNaN(x) && !Number.isNaN(y)) return { x, y };
    } catch {}
    return { x: 24, y: 24 };
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(()=>{
    try { localStorage.setItem("app:chatOpen", open ? "1" : "0"); } catch {}
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (pos.x === 24 && pos.y === 24 && typeof window !== 'undefined') {
      const w = 416; // ~w-96
      const h = 520;
      setPos({ x: Math.max(8, window.innerWidth - w - 16), y: Math.max(8, window.innerHeight - h - 16) });
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem("app:chat:x", String(pos.x));
      localStorage.setItem("app:chat:y", String(pos.y));
    } catch {}
  }, [pos]);

  const onMouseDownHeader = (e: React.MouseEvent) => {
    if (!open) return;
    draggingRef.current = true;
    offsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const cw = rect?.width || 416;
      const ch = rect?.height || 520;
      const nx = Math.min(Math.max(0, ev.clientX - offsetRef.current.dx), (window.innerWidth - cw));
      const ny = Math.min(Math.max(0, ev.clientY - offsetRef.current.dy), (window.innerHeight - ch));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text, ts: Date.now() }]);
    setInput("");

    const t = text.toLowerCase();
    let reply = "Noted. How else can I help?";
    if (t.includes("water")) {
      updateWater(250);
      reply = "Logged 250ml water. Keep hydrating!";
    }
    if (t.includes("ate my lunch") || t.includes("lunch done") || t.includes("meal done")) {
      markMealTaken();
      reply = "Great! I marked your lunch as taken. Want a light herbal tea later?";
    }
    if (t.includes("tip") || t.includes("advice")) {
      reply = "Choose warm, cooked meals. Avoid iced drinks. Ginger and cumin can aid digestion.";
    }

    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: reply, ts: Date.now() }]);
    }, 400);
  };

  return (
    <div className={cn("fixed z-40 flex flex-col items-end gap-3")}>
      {open && (
        <div ref={containerRef} style={{ left: pos.x, top: pos.y, position: 'fixed' }}>
          <Card className="w-96 shadow-xl border-[#0FA36B]/50">
          <div className="flex cursor-move items-center justify-between border-b px-3 py-2" onMouseDown={onMouseDownHeader}>
            <div className="text-sm font-semibold">Ayur Assistant</div>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div>
                  <div className={cn("rounded-md px-3 py-2", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.text}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{new Date(m.ts).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="border-t p-2">
            <div className="mb-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={()=>setInput("I drank water")}>+250ml Water</Button>
              <Button size="sm" variant="outline" onClick={()=>setInput("I ate my lunch")}>I ate lunch</Button>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ setUploadName(e.target.files?.[0]?.name || null); setMessages((m)=>m.concat({ role:"user", text: `Uploaded barcode ${e.target.files?.[0]?.name || "image"}`, ts: Date.now()})); setTimeout(()=> setMessages((m)=>m.concat({ role:"bot", text:"Scanned: Oats 100g • 389 kcal • Tags: Warm, Madhura, Light", ts: Date.now()})), 500); }} />
                <span className="rounded-md border px-2 py-1">Upload Barcode</span>
              </label>
            </div>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message... e.g., I drank water" className="mb-2 h-16" />
            <Button className="w-full" onClick={handleSend}>Send</Button>
          </div>
        </Card>
        </div>
      )}
      {!open && (
        <Button size="lg" className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg" onClick={() => setOpen(true)}>
          <MessageCircle />
        </Button>
      )}
    </div>
  );
};
