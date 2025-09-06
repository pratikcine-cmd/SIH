import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppState } from "@/context/app-state";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

type MealInfo = { name: string; kcal: number; tags: string[]; icon: string };

type WeeklyPlan = { day: string; breakfast: MealInfo; lunch: MealInfo; dinner: MealInfo; snacks: MealInfo }[];

export default function DietPlanPage(){
  const { currentUser, doctors, setRequests } = useAppState();
  const [freq, setFreq] = useState("3");
  const [allergies, setAllergies] = useState("");
  const [water, setWater] = useState(2500);
  const [cuisine, setCuisine] = useState("Indian");
  const [habits, setHabits] = useState("Vegetarian");
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const generator = () => {
    const dosha = currentUser?.dosha || "Kapha";
    const meal = (type: "bf"|"ln"|"dn"|"sn"): MealInfo => {
      const base: Record<string, MealInfo[]> = {
        bf: [
          { name: "Warm Spiced Oats", kcal: 320, tags: ["Warm","Rasa: Madhura","Light"], icon: "🥣" },
          { name: "Ragi Porridge", kcal: 300, tags: ["Grounding","Sattvic"], icon: "🥛" },
        ],
        ln: [
          { name: "Moong Dal Khichdi", kcal: 450, tags: ["Light","Tridoshic"], icon: "🍲" },
          { name: "Veg Millet Bowl", kcal: 480, tags: ["Warm","Madhura"], icon: "🥗" },
        ],
        dn: [
          { name: "Steamed Veg + Ghee", kcal: 420, tags: ["Light","Warm"], icon: "🍲" },
          { name: "Paneer & Spinach", kcal: 430, tags: ["Heavy","Madhura"], icon: "🥗" },
        ],
        sn: [
          { name: "Herbal Tea + Nuts", kcal: 180, tags: ["Warm","Kashaya"], icon: "🍵" },
          { name: "Fruit & Seeds", kcal: 160, tags: ["Cold","Amla"], icon: "🍎" },
        ],
      };
      const pick = (arr: MealInfo[]) => arr[Math.floor(Math.random()*arr.length)];
      const adjust = (m: MealInfo): MealInfo => {
        if (dosha === "Pitta") return { ...m, tags: Array.from(new Set([...m.tags,"Cooling"])) };
        if (dosha === "Vata") return { ...m, tags: Array.from(new Set([...m.tags,"Warm"])) };
        return { ...m, tags: Array.from(new Set([...m.tags,"Light"])) };
      };
      const map: Record<typeof type, MealInfo> = {
        bf: adjust(pick(base.bf)),
        ln: adjust(pick(base.ln)),
        dn: adjust(pick(base.dn)),
        sn: adjust(pick(base.sn)),
      } as any;
      return map[type];
    };

    const week: WeeklyPlan = DAYS.map((d) => ({
      day: d,
      breakfast: meal("bf"),
      lunch: meal("ln"),
      dinner: meal("dn"),
      snacks: meal("sn"),
    }));
    setPlan(week);
  };

  const exportCsv = () => {
    if (!plan) return;
    const header = ["Day","Breakfast","Lunch","Dinner","Snacks"]; 
    const rows = plan.map((r)=>[
      r.day,
      `${r.breakfast.name} (${r.breakfast.kcal})` ,
      `${r.lunch.name} (${r.lunch.kcal})`,
      `${r.dinner.name} (${r.dinner.kcal})`,
      `${r.snacks.name} (${r.snacks.kcal})`,
    ]);
    const csv = [header, ...rows].map((r)=>r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "diet-plan.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diet Plan Generator</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Dietary Habit</Label>
            <Select value={habits} onValueChange={setHabits}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                <SelectItem value="Vegan">Vegan</SelectItem>
                <SelectItem value="Eggetarian">Eggetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Meal Frequency</Label>
            <Select value={freq} onValueChange={setFreq}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Water Goal (ml)</Label>
            <Input type="number" value={water} onChange={(e)=>setWater(parseInt(e.target.value||"0"))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Allergies</Label>
            <Input placeholder="e.g., peanuts, lactose" value={allergies} onChange={(e)=>setAllergies(e.target.value)} />
          </div>
          <div>
            <Label>Cuisine</Label>
            <Select value={cuisine} onValueChange={setCuisine}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Indian">Indian</SelectItem>
                <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                <SelectItem value="Asian">Asian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex items-end gap-2">
            <Button onClick={generator} className="w-full">Generate 7-Day Plan</Button>
            <Button variant="outline" className="w-full" onClick={()=>window.print()}>Print (mock)</Button>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Personalized 7-day Diet Plan</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
              <DisclaimerButton open={disclaimerOpen} setOpen={setDisclaimerOpen} />
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Consult Doctor</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader><DialogTitle>Available Doctors</DialogTitle></DialogHeader>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {doctors.map((d)=> (
                      <Card key={d.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{d.name}</div>
                            <div className="text-xs text-muted-foreground">{d.specialty}</div>
                          </div>
                          <Badge variant="secondary">★ {d.rating}</Badge>
                        </div>
                        <Button className="mt-3 w-full" onClick={()=>{
                          setRequests((r)=> r.concat({ id: `req_${Date.now()}` , userId: "me", doctorId: d.id, status: "pending", createdAt: new Date().toISOString() }));
                        }}>Request Consult</Button>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Breakfast</TableHead>
                    <TableHead>Lunch</TableHead>
                    <TableHead>Dinner</TableHead>
                    <TableHead>Snacks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.map((r, idx)=> (
                    <TableRow key={r.day} className={idx % 2 ? "bg-muted/30" : undefined}>
                      <TableCell className="font-medium">{r.day}</TableCell>
                      <MealCell m={r.breakfast} />
                      <MealCell m={r.lunch} />
                      <MealCell m={r.dinner} />
                      <MealCell m={r.snacks} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const MealCell: React.FC<{ m: MealInfo }> = ({ m }) => {
  return (
    <TableCell>
      <div className="font-medium">{m.icon} {m.name} <span className="text-xs text-muted-foreground">{m.kcal} kcal</span></div>
      <div className="mt-1 flex flex-wrap gap-1">
        {m.tags.map((t,i)=>(<Badge key={i} variant="secondary">{t}</Badge>))}
      </div>
    </TableCell>
  );
};

const DisclaimerButton: React.FC<{ open: boolean; setOpen: (v:boolean)=>void }> = ({ open, setOpen }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button variant="outline">Continue without Doctor</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Disclaimer</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">This plan is a mock recommendation and not medical advice. Consult a qualified practitioner before making significant dietary changes.</p>
      <Button className="mt-3" onClick={()=>setOpen(false)}>I Understand</Button>
    </DialogContent>
  </Dialog>
);
