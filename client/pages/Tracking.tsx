import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis, Cell } from "recharts";
import { useAppState } from "@/context/app-state";

export default function Tracking(){
  const { progress, updateWater, markMealTaken } = useAppState();
  const [reminders, setReminders] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);

  useEffect(()=>{
    if (!reminders) return;
    const id = setInterval(()=>{
      setNotif("Time to drink water (250ml)?");
    }, 8000);
    return ()=>clearInterval(id);
  }, [reminders]);

  const week = useMemo(()=>Array.from({length:7}).map((_,i)=>({ day:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], water: 1200+Math.round(Math.random()*1200), meals: 2+Math.round(Math.random()*1), sleep: 6+Math.round(Math.random()*3) })),[]);

  const COLORS = ["hsl(var(--primary))","hsl(var(--accent))","hsl(var(--muted-foreground))"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Water</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.waterMl}/{progress.waterGoalMl} ml</div>
            <Progress value={Math.round(progress.waterMl/progress.waterGoalMl*100)} className="mt-2" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>updateWater(250)}>+250ml</Button>
              <Button size="sm" variant="outline" onClick={()=>updateWater(500)}>+500ml</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Meals</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.mealsTaken}/{progress.mealsPlanned}</div>
            <Button size="sm" className="mt-2" onClick={markMealTaken}>Mark Meal</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reminders</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch checked={reminders} onCheckedChange={setReminders} />
              <div className="text-sm text-muted-foreground">Mock WhatsApp reminders</div>
            </div>
            {notif && (
              <div className="mt-3 rounded-md border p-3 text-sm">
                <div className="font-medium">Reminder</div>
                <div className="mt-1">{notif}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={()=>{updateWater(250); setNotif(null);}}>Taken</Button>
                  <Button size="sm" variant="outline" onClick={()=>setNotif(null)}>Skip</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Weekly Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Hydration improving. Keep warm meals and avoid iced drinks in the evening.</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Hydration (Bar)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ water:{label:"Water", color:"hsl(var(--primary))"} }}>
              <BarChart data={week}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Bar dataKey="water" fill="hsl(var(--primary))" radius={4} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sleep Trend (Line)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ sleep:{label:"Sleep", color:"hsl(var(--accent))"} }}>
              <LineChart data={week}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Line type="monotone" dataKey="sleep" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Macro Split (Pie)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ carb:{label:"Carb"}, protein:{label:"Protein"}, fat:{label:"Fat"} }}>
              <PieChart>
                <Pie data={[{name:"carb", value:55},{name:"protein", value:20},{name:"fat", value:25}]} dataKey="value" nameKey="name" outerRadius={80}>
                  {COLORS.map((c,i)=>(<Cell key={i} fill={c} />))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Adherence</CardTitle></CardHeader>
          <CardContent>
            <div className="space-x-2">
              <Badge>Warm</Badge>
              <Badge variant="secondary">Light</Badge>
              <Badge>Regular Meals</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
