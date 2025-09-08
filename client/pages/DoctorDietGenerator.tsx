import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

export default function DoctorDietGenerator() {
  const { requests } = useAppState();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [patientId, setPatientId] = useState("");
  const search = new URLSearchParams(location.search);
  const pid = search.get("pid") || "";
  useState(() => { if (pid) setPatientId(pid); return undefined; });
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPatient = () => {
    const match = requests.find(r => r.userId.toLowerCase() === patientId.trim().toLowerCase());
    if (match) {
      setFetchedName(match.patientName || `Patient ${match.userId}`);
      setFetchError(null);
    } else {
      setFetchedName(null);
      setFetchError("No patient found with that ID. Please re-enter.");
    }
  };

  // Step 2 inputs
  const [cuisine, setCuisine] = useState("Indian");
  const [veg, setVeg] = useState(true);
  const [activity, setActivity] = useState<"Low"|"Moderate"|"High">("Moderate");
  const [restrictions, setRestrictions] = useState<string[]>([]);

  const toggleRestriction = (value: string) => {
    setRestrictions(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  // Step 3 generation
  type Meal = { type: "Breakfast"|"Lunch"|"Dinner"|"Snacks"; name: string; calories: number; protein: number; carbs: number; fat: number; vitamins: string[]; ayur: { rasa: string; virya: string; vipaka: string; guna: string[] } };
  type DayPlan = { day: string; meals: Meal[] };

  const recommend = useMemo(() => {
    const water = activity === "High" ? 3 : activity === "Moderate" ? 2.5 : 2;
    const calories = activity === "High" ? 2600 : activity === "Moderate" ? 2200 : 1800;
    return { water, calories };
  }, [activity]);

  const sampleByCuisine = (type: Meal["type"], veg: boolean, cuisine: string): string => {
    const base: Record<string, Record<string, [string, string]>> = {
      Indian: {
        Breakfast: ["Warm Spiced Oats", "Poha"],
        Lunch: [veg ? "Moong Dal Khichdi" : "Chicken Curry + Rice", "Veg Thali"],
        Dinner: [veg ? "Millet Roti + Veg" : "Grilled Fish + Veg", "Dal + Rice"],
        Snacks: ["Fruit + Nuts", "Herbal Tea"]
      },
      Mediterranean: {
        Breakfast: [veg ? "Greek Yogurt + Fruit" : "Egg Omelette", "Avocado Toast"],
        Lunch: [veg ? "Chickpea Salad" : "Grilled Chicken Salad", "Pasta Primavera"],
        Dinner: [veg ? "Veg Mezze Bowl" : "Baked Salmon", "Lentil Stew"],
        Snacks: ["Hummus + Veg", "Olives + Nuts"],
      },
      Continental: {
        Breakfast: [veg ? "Pancakes" : "Scrambled Eggs", "Granola Bowl"],
        Lunch: [veg ? "Veg Sandwich" : "Turkey Sandwich", "Tomato Soup"],
        Dinner: [veg ? "Veg Pasta" : "Steak + Mash", "Risotto"],
        Snacks: ["Trail Mix", "Fruit Bowl"],
      }
    };
    const pool = (base[cuisine] || base["Indian"])[type];
    const pick = pool[Math.floor(Math.random()*pool.length)];
    return pick;
  };

  const macros = (kcal: number) => ({ protein: Math.round(kcal*0.2/4), carbs: Math.round(kcal*0.55/4), fat: Math.round(kcal*0.25/9) });

  const generatePlan = (): DayPlan[] => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return days.map((d) => {
      const meals: Meal[] = ["Breakfast","Lunch","Dinner","Snacks"].map((t) => {
        const name = sampleByCuisine(t as Meal["type"], veg, cuisine);
        const baseKcal = t === "Breakfast" ? 400 : t === "Lunch" ? 600 : t === "Dinner" ? 550 : 200;
        const m = { type: t as Meal["type"], name, calories: baseKcal, ...macros(baseKcal), vitamins: ["A","B","C"], ayur: { rasa: "Madhura", virya: "Ushna", vipaka: "Madhura", guna: ["Sattvic","Light"] } };
        // Remove restricted
        if (restrictions.includes("nuts") && /nut|nuts/i.test(name)) m.name = name.replace(/\+?\s*\bNuts\b/i, "").trim();
        if (restrictions.includes("dairy") && /yogurt|paneer|curd|milk/i.test(name)) m.name = "Dairy-free Bowl";
        if (!veg && /Veg\b/i.test(name)) m.name = name.replace(/Veg\s*/i, "").trim();
        return m;
      });
      return { day: d, meals };
    });
  };

  const [plan, setPlan] = useState<DayPlan[] | null>(null);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diet Plan Generator</h1>
            <p className="text-muted-foreground">Generate personalized 7-day meal plans with nutritional guidance</p>
          </div>
          <div className="w-48"><Progress value={progress} /></div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1 of 3 • Patient Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input placeholder="Enter Patient ID" value={patientId} onChange={(e)=>setPatientId(e.target.value)} />
            <Button onClick={fetchPatient}>Fetch Patient</Button>
          </div>
          {fetchedName && (
            <div className="mt-3 rounded-md border bg-secondary/30 p-3">
              <div className="font-medium">{fetchedName}</div>
              <div className="mt-2 text-sm">Is this the correct patient?</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={()=>setStep(2)}>Yes</Button>
                <Button size="sm" variant="outline" onClick={()=>{ setFetchedName(null); setPatientId(""); }}>No</Button>
              </div>
            </div>
          )}
          {fetchError && <div className="mt-3 text-sm text-destructive">{fetchError}</div>}
        </CardContent>
      </Card>

      <Card className={step >= 2 ? "opacity-100" : "opacity-60 pointer-events-none"}>
        <CardHeader>
          <CardTitle>Step 2 of 3 • Diet Plan Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Preferred Cuisine</div>
              <Select value={cuisine} onValueChange={setCuisine}>
                <SelectTrigger><SelectValue placeholder="Select cuisine" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indian">Indian</SelectItem>
                  <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                  <SelectItem value="Continental">Continental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Vegetarian</div>
              <div className="flex items-center gap-3">
                <Switch checked={veg} onCheckedChange={setVeg} id="veg" />
                <Label htmlFor="veg">{veg ? "Vegetarian" : "Non-Vegetarian"}</Label>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Daily Activity Level</div>
              <Select value={activity} onValueChange={(v)=>setActivity(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Any Food Restrictions?</div>
              <ToggleGroup type="multiple" className="flex flex-wrap gap-2">
                {['dairy','gluten','nuts','sugar'].map(tag => (
                  <ToggleGroupItem key={tag} pressed={restrictions.includes(tag)} onPressedChange={()=>toggleRestriction(tag)} value={tag} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    {tag}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={step >= 3 ? "opacity-100" : "opacity-60 pointer-events-none"}>
        <CardHeader>
          <CardTitle>Step 3 of 3 • Generate Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="mb-4" onClick={()=>{ setPlan(generatePlan()); setStep(3); }}>Generate Diet Plan</Button>

          {plan && (
            <div className="space-y-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Meal Type</TableHead>
                      <TableHead>Meal Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.map((d) => (
                      d.meals.map((m, i) => (
                        <TableRow key={`${d.day}-${i}`}>
                          {i === 0 ? <TableCell rowSpan={d.meals.length} className="align-top">{d.day}</TableCell> : null}
                          <TableCell>{m.type}</TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default rounded px-1.5 py-0.5 hover:bg-muted/60 transition-colors">{m.name}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs text-xs">
                                  <div className="font-medium">{m.name}</div>
                                  <div>Calories: {m.calories} kcal</div>
                                  <div>Protein: {m.protein} g • Carbs: {m.carbs} g • Fat: {m.fat} g</div>
                                  <div>Vitamins: {m.vitamins.join(', ')}</div>
                                  <div>Ayur: Rasa {m.ayur.rasa}, Virya {m.ayur.virya}, Vipaka {m.ayur.vipaka}, Guna {m.ayur.guna.join(', ')}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <div>Recommended Water Intake per Day: <span className="font-medium">{recommend.water} liters</span></div>
                <div>Recommended Daily Calories: <span className="font-medium">{recommend.calories} kcal</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={()=>navigate(-1)}>Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>setStep((s)=> Math.max(1, (s-1) as any))}>Previous</Button>
          <Button onClick={()=>setStep((s)=> Math.min(3, (s+1) as any))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
