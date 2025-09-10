import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
          <Button variant="outline" onClick={()=>navigate(`/doctor/generator/recipes?pid=${req.userId}`)}>Recipe Generator</Button>
          <Button onClick={()=>navigate(`/doctor/generator/diet?pid=${req.userId}`)}>Generate Diet Plan</Button>
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
                      <TableHead>Meal</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekly.days.map((day, di) => (
                      day.meals.map((m, mi) => (
                        <TableRow key={`${day.date}-${mi}`}>
                          {mi === 0 ? (
                            <TableCell rowSpan={day.meals.length} className="font-mono text-xs align-top">
                              {new Date(day.date).toLocaleDateString()}
                            </TableCell>
                          ) : null}
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="underline-offset-2 hover:underline" onClick={()=>setDetail({di, mi})}>{m.name}</button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs text-xs">
                                  <div className="font-medium">{m.name}</div>
                                  <div>Calories: {m.calories}</div>
                                  {m.dosha && <div>Dosha: {m.dosha}</div>}
                                  {m.rasa && <div>Rasa: {m.rasa}</div>}
                                  {m.properties && m.properties.length>0 && <div>Props: {m.properties.join(", ")}</div>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{m.type}</TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!detail} onOpenChange={(o)=>!o && setDetail(null)}>
            <DialogContent className="sm:max-w-[560px]">
              {detail && weekly && (
                <>
                  <DialogHeader>
                    <DialogTitle>Meal Details</DialogTitle>
                    <DialogDescription>Nutrition and Ayurveda properties</DialogDescription>
                  </DialogHeader>
                  {(() => {
                    const m = weekly.days[detail.di].meals[detail.mi];
                    const date = weekly.days[detail.di].date;
                    return (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Date</div>
                            <div className="font-mono text-xs">{new Date(date).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Type</div>
                            <div className="font-medium">{m.type}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Meal</div>
                            <div className="font-medium">{m.name}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Calories</div>
                            <div>{m.calories}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Protein (g)</div>
                            <div>{m.protein ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Carbs (g)</div>
                            <div>{m.carbs ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Fat (g)</div>
                            <div>{m.fat ?? "—"}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Dosha</div>
                            <div>{m.dosha || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Rasa</div>
                            <div>{m.rasa || "—"}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Properties</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(m.properties || []).length ? (m.properties || []).map(p => <Badge key={p} variant="secondary">{p}</Badge>) : <span className="text-muted-foreground">—</span>}
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
