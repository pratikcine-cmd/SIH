import React, { useMemo, useState } from "react";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChefHat, Salad, Stethoscope, ScanLine, Bot, Droplet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, progress, updateWater, markMealTaken, dietPlan, generateMockPlan, doctors, setRequests, notifications, addNotification, markAllRead, markNotificationRead } = useAppState();
  const [dietOpen, setDietOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);

  const waterPct = Math.round((progress.waterMl / progress.waterGoalMl) * 100);
  const mealPct = Math.round((progress.mealsTaken / progress.mealsPlanned) * 100);

  const chartData = useMemo(() => (
    Array.from({ length: 7 }).map((_, i) => ({ day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], water: 1500 + Math.round(Math.random()*800), meals: 2 + Math.round(Math.random()) }))
  ), []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dosha</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUser?.dosha || "Unclassified"}</div>
            <p className="text-xs text-muted-foreground">Complete quiz to personalize</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.waterMl} / {progress.waterGoalMl} ml</div>
            <Progress value={waterPct} className="mt-2" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => updateWater(250)}>+250ml</Button>
              <Button size="sm" variant="outline" onClick={() => updateWater(500)}>+500ml</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meals</CardTitle>
            <Salad className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.mealsTaken}/{progress.mealsPlanned}</div>
            <Progress value={mealPct} className="mt-2" />
            <Button size="sm" className="mt-2" onClick={markMealTaken}>Mark Meal Taken</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Plan</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dietPlan ? dietPlan.date : "None"}</div>
            <p className="text-xs text-muted-foreground">Generate a plan to get started</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Hydration</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ water: { label: "Water", color: "hsl(var(--primary))" } }}>
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Area type="monotone" dataKey="water" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.2)" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="w-full" onClick={() => navigate('/diet-plan')}>Generate Diet Plan</Button>
            <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex gap-2"><Stethoscope className="h-4 w-4" /> Connect with Doctor</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Available Doctors</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  {doctors.map((d) => (
                    <Card key={d.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.specialty}</div>
                        </div>
                        <Badge variant="secondary">★ {d.rating}</Badge>
                      </div>
                      <Button className="mt-3 w-full" onClick={() => {
                        setRequests((r) => r.concat({ id: `req_${Date.now()}`, userId: currentUser?.id || "me", doctorId: d.id, status: "pending", createdAt: new Date().toISOString(), patientName: currentUser?.name, patientDosha: currentUser?.dosha }));
                        setConnectOpen(false);
                        addNotification({ type: "doctor", title: "Consultation requested", message: `We’ll connect you with ${d.name} shortly.` });
                        toast({ title: "Consultation requested", description: `We’ll connect you with ${d.name} shortly. You’ll see updates in Notifications.` });
                      }}>Request Consult</Button>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full flex gap-2" onClick={() => navigate('/scan')}><ScanLine className="h-4 w-4" /> Scan Barcode</Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/recipes')}>Recipe Generator</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          <Button variant="outline" size="sm" onClick={markAllRead}>Mark all read</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.length === 0 && (
              <div className="text-sm text-muted-foreground">No notifications yet.</div>
            )}
            {notifications.slice(0,10).map((n)=> (
              <div key={n.id} className="flex items-start gap-3 rounded-md border p-2">
                <span className={`mt-1 inline-block h-2 w-2 rounded-full ${n.read ? 'bg-muted' : 'bg-primary'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.message}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-muted-foreground">{new Date(n.time).toLocaleTimeString()}</div>
                  <Button variant="ghost" size="sm" onClick={()=> markNotificationRead(n.id)}>Mark read</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {dietPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Diet Plan for {dietPlan.date}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Calories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dietPlan.meals.map((m, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{m.time}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.properties.map((p, i) => (
                          <Badge key={i} variant="secondary">{p}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{m.calories}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const DietPlanForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { generateMockPlan } = useAppState();
  const [cuisine, setCuisine] = useState("Indian");
  const [allergy, setAllergy] = useState("");
  const [water, setWater] = useState(2500);
  return (
    <DialogContent className="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>Diet Plan Generator</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Cuisine</Label>
          <div className="col-span-3">
            <Select value={cuisine} onValueChange={setCuisine}>
              <SelectTrigger><SelectValue placeholder="Select cuisine" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Indian">Indian</SelectItem>
                <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                <SelectItem value="Asian">Asian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Allergies</Label>
          <Input className="col-span-3" value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="e.g., peanuts" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Water Goal (ml)</Label>
          <Input type="number" className="col-span-3" value={water} onChange={(e) => setWater(parseInt(e.target.value || "0"))} />
        </div>
        <Button onClick={() => { generateMockPlan({ notes: `Cuisine: ${cuisine}. Allergy: ${allergy || "none"}` }); onDone(); }}>Generate</Button>
      </div>
    </DialogContent>
  );
};

const ScanModal: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ name: string; qty: string; props: string[]; kcal: number } | null>(null);
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Barcode Scanner</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code or simulate camera" />
        <Button onClick={() => setResult({ name: "Oats", qty: "100g", props: ["Warm", "Rasa: Madhura"], kcal: 389 })}>Scan</Button>
        {result && (
          <Card className="p-3">
            <div className="font-semibold">{result.name} • {result.qty}</div>
            <div className="text-sm text-muted-foreground">Calories: {result.kcal}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {result.props.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
            </div>
          </Card>
        )}
      </div>
    </DialogContent>
  );
};

const RecipeModal: React.FC<{ onDone: () => void }> = () => {
  const [base, setBase] = useState("oats, moong dal, ghee");
  const [constraints, setConstraints] = useState("no dairy at night");
  const [recipe, setRecipe] = useState<{ title: string; steps: string[]; tags: string[]; kcal: number } | null>(null);
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Recipe Generator</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label>Base Ingredients</Label>
          <Input value={base} onChange={(e) => setBase(e.target.value)} />
        </div>
        <div>
          <Label>Constraints</Label>
          <Input value={constraints} onChange={(e) => setConstraints(e.target.value)} />
        </div>
        <Button onClick={() => setRecipe({ title: "Moong Oats Khichdi", steps: ["Rinse moong and oats","Pressure cook with cumin & ginger","Finish with ghee"], tags: ["Sattvic","Light","Warm"], kcal: 420 })}>Generate</Button>
        {recipe && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{recipe.title}</div>
                <div className="text-xs text-muted-foreground">Approx {recipe.kcal} kcal</div>
              </div>
              <div className="flex gap-1">{recipe.tags.map((t,i)=>(<Badge key={i} variant="secondary">{t}</Badge>))}</div>
            </div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {recipe.steps.map((s,i)=>(<li key={i}>{s}</li>))}
            </ol>
          </Card>
        )}
      </div>
    </DialogContent>
  );
};
