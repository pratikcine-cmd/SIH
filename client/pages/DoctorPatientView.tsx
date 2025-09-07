import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export default function DoctorPatientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, setRequests, generateMockPlan } = useAppState();
  const req = useMemo(() => requests.find(r => r.id === id), [requests, id]);

  type Meal = { time: string; type: "Breakfast"|"Lunch"|"Snack"|"Dinner"; name: string; calories: number; waterMl?: number; properties?: string[]; dosha?: string; rasa?: string; protein?: number; carbs?: number; fat?: number };
  type DayPlan = { date: string; meals: Meal[] };
  type WeeklyPlan = { days: DayPlan[] };
  const wpKey = `app:weeklyPlan:${id}`;
  const loadWP = (): WeeklyPlan | null => {
    try { const raw = localStorage.getItem(wpKey); return raw ? JSON.parse(raw) as WeeklyPlan : null; } catch { return null; }
  };
  const saveWP = (wp: WeeklyPlan) => localStorage.setItem(wpKey, JSON.stringify(wp));

  const toType = (time: string): DayPlan["meals"][number]["type"] => {
    const [h] = time.split(":");
    const n = parseInt(h, 10);
    if (n < 11) return "Breakfast";
    if (n < 16) return "Lunch";
    if (n < 19) return "Snack";
    return "Dinner";
  };

  const calcMacros = (cal: number) => {
    const protein = Math.round((cal * 0.2) / 4);
    const carbs = Math.round((cal * 0.55) / 4);
    const fat = Math.round((cal * 0.25) / 9);
    return { protein, carbs, fat };
  };

  const generate7 = () => {
    const base = generateMockPlan();
    const start = new Date();
    const days: DayPlan[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const date = d.toISOString().slice(0,10);
      const addSnack: Meal = { time: "16:00", name: "Fruit + Nuts", calories: 180, waterMl: 200, properties: ["Light","Sattvic"], type: "Snack", dosha: (req?.patientDosha || "Tridoshic") as any, rasa: "Madhura", ...calcMacros(180) };
      const withTypes: Meal[] = base.meals.map((m) => {
        const type = toType(m.time);
        const rasaProp = (m.properties || []).find(p => p.startsWith("Rasa:")) || "Rasa: Madhura";
        const rasa = rasaProp.replace("Rasa:", "").trim();
        const macros = calcMacros(m.calories || 0);
        return { ...m, type, dosha: (req?.patientDosha || "Tridoshic") as any, rasa, ...macros };
      });
      const hasSnack = withTypes.some(m => m.type === "Snack");
      const meals = hasSnack ? withTypes : [...withTypes, addSnack];
      return { date, meals };
    });
    const wp = { days };
    saveWP(wp);
    // also mirror a single-day plan into request for compatibility (first day)
    setRequests(requests.map(r => r.id === id ? { ...r, status: r.status === "rejected" ? "accepted" : r.status, plan: days[0].meals.map(m=>({ time:m.time, name:m.name, calories:m.calories, waterMl:m.waterMl })) } : r));
    return wp;
  };

  const [weekly, setWeekly] = useState<WeeklyPlan | null>(() => loadWP());
  const [detail, setDetail] = useState<{ di: number; mi: number } | null>(null);

  const updateMeal = (di: number, mi: number, patch: Partial<Meal>) => {
    setWeekly((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((day, i) => {
        if (i !== di) return day;
        const meals = day.meals.map((m, j) => (j === mi ? { ...m, ...patch } : m));
        return { ...day, meals };
      });
      const next = { days };
      saveWP(next);
      return next;
    });
  };

  if (!req) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Patient not found</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={()=>navigate(-1)}>Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = useMemo(() => {
    if (!weekly) return { perDay: [], avgCal: 0, avgWater: 0 };
    const perDay = weekly.days.map(d => ({
      date: d.date,
      calories: d.meals.reduce((s,m)=>s+(m.calories||0),0),
      water: d.meals.reduce((s,m)=>s+(m.waterMl||0),0),
    }));
    const avgCal = perDay.length ? Math.round(perDay.reduce((s,x)=>s+x.calories,0)/perDay.length) : 0;
    const avgWater = perDay.length ? Math.round(perDay.reduce((s,x)=>s+x.water,0)/perDay.length) : 0;
    return { perDay, avgCal, avgWater };
  }, [weekly]);

  const regen = () => setWeekly(generate7());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xl font-semibold">{req.patientName || `Patient ${req.userId}`}</div>
          {weekly ? (
            <div className="text-sm text-muted-foreground">7-Day Diet Plan • Avg {stats.avgCal} kcal • Avg {stats.avgWater} ml water</div>
          ) : (
            <div className="text-sm text-muted-foreground">No analysis yet • Generate a 7-day plan</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>navigate("/doctor/patients")}>Back to Patients</Button>
          <Button variant="outline" onClick={()=>navigate("/recipes")}>Recipe Generator</Button>
          <Button onClick={()=>setWeekly(generate7())}>Generate Diet Plan</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Age</div>
              <div className="font-medium">{req.patientProfile?.age ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Gender</div>
              <div className="font-medium">{req.patientProfile?.gender ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Dosha</div>
              <div className="font-medium">{req.patientDosha ?? "—"}</div>
            </div>
          </div>
          {!req.patientProfile && (
            <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">Not sufficient data. Add medical details to personalize the plan.</div>
          )}
        </CardContent>
      </Card>

      {weekly ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ChartContainer config={{ cal:{label:"Calories", color:"hsl(var(--primary))"} }}>
                  <BarChart data={stats.perDay}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="calories" fill="var(--color-cal)" radius={4} />
                  </BarChart>
                </ChartContainer>
                <ChartContainer config={{ water:{label:"Water", color:"hsl(var(--accent))"} }}>
                  <LineChart data={stats.perDay}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="water" stroke="var(--color-water)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Averages: {stats.avgCal} kcal/day • {stats.avgWater} ml water/day</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7-Day Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead className="hidden lg:table-cell">Properties</TableHead>
                      <TableHead className="text-right">Calories</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Water (ml)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekly.days.flatMap((day, di) => day.meals.map((m, mi) => (
                      <TableRow key={`${day.date}-${mi}`}>
                        <TableCell className="font-mono text-xs">{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell className="w-[100px]">
                          <Input value={m.time} onChange={(e)=>updateMeal(di, mi, { time: e.target.value, type: toType(e.target.value) })} className="h-8 py-1" />
                        </TableCell>
                        <TableCell className="w-[160px]">
                          <Select value={m.type} onValueChange={(v)=>updateMeal(di, mi, { type: v as Meal["type"] })}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Breakfast">Breakfast</SelectItem>
                              <SelectItem value="Lunch">Lunch</SelectItem>
                              <SelectItem value="Snack">Snack</SelectItem>
                              <SelectItem value="Dinner">Dinner</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <Input value={m.name} onChange={(e)=>updateMeal(di, mi, { name: e.target.value })} onClick={()=>setDetail({di, mi})} className="h-8 py-1" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Input value={(m.properties||[]).join(", ")} onChange={(e)=>updateMeal(di, mi, { properties: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })} className="h-8 py-1" />
                        </TableCell>
                        <TableCell className="text-right w-[120px]">
                          <Input type="number" value={m.calories} onChange={(e)=>updateMeal(di, mi, { calories: Number(e.target.value)||0, ...calcMacros(Number(e.target.value)||0) })} className="h-8 py-1 text-right" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right w-[120px]">
                          <Input type="number" value={m.waterMl || 0} onChange={(e)=>updateMeal(di, mi, { waterMl: Number(e.target.value)||0 })} className="h-8 py-1 text-right" />
                        </TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!detail} onOpenChange={(o)=>!o && setDetail(null)}>
            <DialogContent className="sm:max-w-[560px]">
              {detail && (
                <>
                  <DialogHeader>
                    <DialogTitle>Meal Details</DialogTitle>
                    <DialogDescription>Edit nutrition and Ayurveda properties</DialogDescription>
                  </DialogHeader>
                  {(() => {
                    const m = weekly.days[detail.di].meals[detail.mi];
                    const date = weekly.days[detail.di].date;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Date</div>
                            <div className="font-mono text-xs">{new Date(date).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Time</div>
                            <Input value={m.time} onChange={(e)=>updateMeal(detail.di, detail.mi, { time: e.target.value, type: toType(e.target.value) })} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Type</div>
                            <Select value={m.type} onValueChange={(v)=>updateMeal(detail.di, detail.mi, { type: v as Meal["type"] })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Breakfast">Breakfast</SelectItem>
                                <SelectItem value="Lunch">Lunch</SelectItem>
                                <SelectItem value="Snack">Snack</SelectItem>
                                <SelectItem value="Dinner">Dinner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Meal</div>
                            <Input value={m.name} onChange={(e)=>updateMeal(detail.di, detail.mi, { name: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Calories</div>
                            <Input type="number" value={m.calories} onChange={(e)=>updateMeal(detail.di, detail.mi, { calories: Number(e.target.value)||0, ...calcMacros(Number(e.target.value)||0) })} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Protein (g)</div>
                            <Input type="number" value={m.protein || 0} onChange={(e)=>updateMeal(detail.di, detail.mi, { protein: Number(e.target.value)||0 })} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Carbs (g)</div>
                            <Input type="number" value={m.carbs || 0} onChange={(e)=>updateMeal(detail.di, detail.mi, { carbs: Number(e.target.value)||0 })} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Fat (g)</div>
                            <Input type="number" value={m.fat || 0} onChange={(e)=>updateMeal(detail.di, detail.mi, { fat: Number(e.target.value)||0 })} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Water (ml)</div>
                            <Input type="number" value={m.waterMl || 0} onChange={(e)=>updateMeal(detail.di, detail.mi, { waterMl: Number(e.target.value)||0 })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Dosha</div>
                            <Input value={m.dosha || ""} onChange={(e)=>updateMeal(detail.di, detail.mi, { dosha: e.target.value })} placeholder="Vata / Pitta / Kapha / Tridoshic" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Rasa</div>
                            <Input value={m.rasa || ""} onChange={(e)=>updateMeal(detail.di, detail.mi, { rasa: e.target.value })} placeholder="Madhura / Amla / Lavana / ..." />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Properties</div>
                          <Input value={(m.properties||[]).join(", ")} onChange={(e)=>updateMeal(detail.di, detail.mi, { properties: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })} />
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(m.properties || []).map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-destructive/10 p-3 text-sm">
              <div className="font-medium">Not sufficient data</div>
              <div className="text-muted-foreground">No analysis available yet. Generate a 7-day diet plan and begin tracking the patient's progress.</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
