import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export default function DoctorPatientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, setRequests, generateMockPlan } = useAppState();
  const req = useMemo(() => requests.find(r => r.id === id), [requests, id]);

  type DayPlan = { date: string; meals: { time: string; type: "Breakfast"|"Lunch"|"Snack"|"Dinner"; name: string; calories: number; waterMl?: number; properties?: string[] }[] };
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

  const generate7 = () => {
    const base = generateMockPlan();
    const start = new Date();
    const days: DayPlan[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const date = d.toISOString().slice(0,10);
      const addSnack = { time: "16:00", name: "Fruit + Nuts", calories: 180, waterMl: 200, properties: ["Light","Sattvic"] };
      const withTypes = base.meals.map(m => ({ ...m, type: toType(m.time) }));
      const hasSnack = withTypes.some(m => m.type === "Snack");
      const meals = hasSnack ? withTypes : [...withTypes, { ...addSnack, type: "Snack" as const }];
      return { date, meals };
    });
    const wp = { days };
    saveWP(wp);
    // also mirror a single-day plan into request for compatibility (first day)
    setRequests(requests.map(r => r.id === id ? { ...r, status: r.status === "rejected" ? "accepted" : r.status, plan: days[0].meals.map(m=>({ time:m.time, name:m.name, calories:m.calories, waterMl:m.waterMl })) } : r));
    return wp;
  };

  const [weekly, setWeekly] = useState<WeeklyPlan>(() => loadWP() || generate7());

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
    const perDay = weekly.days.map(d => ({
      date: d.date,
      calories: d.meals.reduce((s,m)=>s+(m.calories||0),0),
      water: d.meals.reduce((s,m)=>s+(m.waterMl||0),0),
    }));
    const avgCal = Math.round(perDay.reduce((s,x)=>s+x.calories,0)/perDay.length);
    const avgWater = Math.round(perDay.reduce((s,x)=>s+x.water,0)/perDay.length);
    return { perDay, avgCal, avgWater };
  }, [weekly]);

  const regen = () => setWeekly(generate7());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xl font-semibold">{req.patientName || `Patient ${req.userId}`}</div>
          <div className="text-sm text-muted-foreground">7-Day Diet Plan • Avg {stats.avgCal} kcal • Avg {stats.avgWater} ml water</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>navigate("/doctor/patients")}>Back to Patients</Button>
          <Button variant="outline" onClick={()=>navigate("/recipes")}>Recipe Generator</Button>
          <Button onClick={regen}>Generate Diet Plan</Button>
        </div>
      </div>

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

      <div className="grid gap-4 md:grid-cols-2">
        {weekly.days.map((day) => (
          <Card key={day.date} className="border-sidebar-border">
            <CardHeader>
              <CardTitle>{new Date(day.date).toLocaleDateString(undefined,{ weekday:"short", month:"short", day:"numeric" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead className="hidden lg:table-cell">Properties</TableHead>
                      <TableHead className="text-right">Calories</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {day.meals.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell>{m.type}</TableCell>
                        <TableCell className="font-mono text-xs">{m.time}</TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(m.properties || ["Sattvic"]).map(p => (
                              <Badge key={p} variant="secondary">{p}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{m.calories}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
