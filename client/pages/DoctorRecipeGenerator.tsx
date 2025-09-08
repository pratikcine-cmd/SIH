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

export default function DoctorRecipeGenerator() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1|2|3>(1);
  const search = new URLSearchParams(location.search);

  // Step 1
  const [patientId, setPatientId] = useState<string>(search.get("pid") || "");
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { requests } = useAppState();
  const fetchPatient = () => {
    const match = requests.find(r => r.userId.toLowerCase() === patientId.trim().toLowerCase());
    if (match) { setFetchedName(match.patientName || `Patient ${match.userId}`); setFetchError(null); }
    else { setFetchedName(null); setFetchError("No patient found with that ID. Please re-enter."); }
  };

  // Step 2 inputs
  const [cuisine, setCuisine] = useState("Indian");
  const [veg, setVeg] = useState(true);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const toggleRestriction = (value: string) => setRestrictions(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

  // Step 3 generate recipes
  type Recipe = { name: string; cuisine: string; veg: boolean; calories: number; protein: number; carbs: number; fat: number; vitamins: string[]; ayur: { rasa: string; virya: string; vipaka: string; guna: string[] }; ingredients: string[]; steps: string[] };

  const macros = (kcal: number) => ({ protein: Math.round(kcal*0.2/4), carbs: Math.round(kcal*0.55/4), fat: Math.round(kcal*0.25/9) });
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random()*arr.length)];

  const generateRecipes = (): Recipe[] => {
    const baseNames: Record<string, string[]> = {
      Indian: ["Moong Dal Khichdi","Veg Pulao","Besan Chilla","Masala Oats","Paneer Tikka","Chicken Curry"],
      Mediterranean: ["Chickpea Salad","Greek Bowl","Lentil Soup","Pasta Primavera","Baked Salmon"],
      Continental: ["Tomato Soup","Veg Sandwich","Grilled Chicken","Quinoa Bowl","Avocado Toast"],
    };
    const names = baseNames[cuisine] || baseNames["Indian"];
    const list: Recipe[] = Array.from({length:6}).map(() => {
      const nm = pick(names);
      const kcal = veg ? 400 + Math.floor(Math.random()*250) : 450 + Math.floor(Math.random()*300);
      const rec: Recipe = {
        name: nm,
        cuisine,
        veg,
        calories: kcal,
        ...macros(kcal),
        vitamins: ["A","B","C"],
        ayur: { rasa: pick(["Madhura","Amla","Lavana","Katu","Tikta","Kashaya"]), virya: pick(["Ushna","Shita"]), vipaka: pick(["Madhura","Amla","Katu"]), guna: [pick(["Sattvic","Rajasik","Tamasik"]), pick(["Light","Heavy"]) ] },
        ingredients: ["Ingredient 1","Ingredient 2","Ingredient 3","Ingredient 4"],
        steps: ["Prep ingredients","Cook base","Add spices","Finish and serve"],
      };
      return rec;
    });
    return list.filter(r => !(restrictions.includes("nuts") && /nut|nuts/i.test(r.name)));
  };

  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Recipe Generator</h1>
            <p className="text-muted-foreground">Create delicious recipes tailored to your patient's preferences</p>
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
          <CardTitle>Step 2 of 3 • Preferences</CardTitle>
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
                <Switch checked={veg} onCheckedChange={setVeg} id="veg2" />
                <Label htmlFor="veg2">{veg ? "Vegetarian" : "Non-Vegetarian"}</Label>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Restrictions</div>
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
          <CardTitle>Step 3 of 3 • Generate Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="mb-4" onClick={()=>{ setRecipes(generateRecipes()); setStep(3); }}>Generate Recipes</Button>
          {recipes && (
            <div className="grid gap-4 md:grid-cols-2">
              {recipes.map((r, i) => (
                <Card key={i} className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base">{r.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground mb-2">{r.cuisine} • {r.veg ? "Vegetarian" : "Non-Vegetarian"}</div>
                    <div className="rounded-lg border mb-3">
                      <Table>
                        <TableBody>
                          <TableRow><TableCell>Calories</TableCell><TableCell className="text-right">{r.calories} kcal</TableCell></TableRow>
                          <TableRow><TableCell>Macros</TableCell><TableCell className="text-right">P {r.protein}g • C {r.carbs}g • F {r.fat}g</TableCell></TableRow>
                          <TableRow><TableCell>Vitamins</TableCell><TableCell className="text-right">{r.vitamins.join(', ')}</TableCell></TableRow>
                          <TableRow><TableCell>Ayurveda</TableCell><TableCell className="text-right">Rasa {r.ayur.rasa}, Virya {r.ayur.virya}, Vipaka {r.ayur.vipaka}, Guna {r.ayur.guna.join(', ')}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mb-2 font-medium">Ingredients</div>
                    <ul className="mb-3 list-disc pl-6 text-sm">
                      {r.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
                    </ul>
                    <div className="mb-2 font-medium">Steps</div>
                    <ol className="list-decimal pl-6 text-sm space-y-1">
                      {r.steps.map((s, idx) => <li key={idx}>{s}</li>)}
                    </ol>
                  </CardContent>
                </Card>
              ))}
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
