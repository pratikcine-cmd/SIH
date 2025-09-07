import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";

export default function DoctorPatients() {
  const { currentUser, doctors, requests } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const getDoctorProfileId = () => {
    const key = `app:doctor-map:${currentUser?.id || "anon"}`;
    let mapped = localStorage.getItem(key);
    if (!mapped) {
      mapped = doctors[0]?.id || "d1";
      localStorage.setItem(key, mapped);
    }
    return mapped;
  };
  const doctorProfileId = getDoctorProfileId();

  type LastViewedMap = Record<string, number>;
  const lvKey = `app:patients:lastViewed:${doctorProfileId}`;
  const readLV = (): LastViewedMap => {
    try { return JSON.parse(localStorage.getItem(lvKey) || "{}"); } catch { return {}; }
  };
  const writeLV = (m: LastViewedMap) => localStorage.setItem(lvKey, JSON.stringify(m));
  const markViewed = (id: string) => { const m = readLV(); m[id] = Date.now(); writeLV(m); };

  const myPatients = useMemo(() => requests.filter(r => r.doctorId === doctorProfileId && r.status === "accepted"), [requests, doctorProfileId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lv = readLV();
    const arr = myPatients.filter(r => {
      const name = (r.patientName || `Patient ${r.userId}`).toLowerCase();
      return q ? name.includes(q) : true;
    });
    return arr.sort((a,b) => {
      const la = lv[a.id];
      const lb = lv[b.id];
      if (la && lb) return lb - la;
      if (la && !lb) return -1;
      if (!la && lb) return 1;
      const na = (a.patientName || `Patient ${a.userId}`).toLowerCase();
      const nb = (b.patientName || `Patient ${b.userId}`).toLowerCase();
      return na.localeCompare(nb);
    });
  }, [query, myPatients]);

  useEffect(() => {
    // ensure lv exists
    if (!localStorage.getItem(lvKey)) writeLV({});
  }, [lvKey]);

  const formatLV = (id: string) => {
    const lv = readLV();
    const t = lv[id];
    return t ? new Date(t).toLocaleString() : "Never";
  };

  const openDetails = (id: string) => {
    markViewed(id);
    navigate(`/doctor/patients/${id}`);
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search patients by name" className="pl-8" />
            </div>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden sm:table-cell">Last viewed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No patients found</TableCell>
                  </TableRow>
                )}
                {filtered.map((r)=>{
                  const name = r.patientName || `Patient ${r.userId}`;
                  const initials = name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback>{initials}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-medium leading-tight">{name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{formatLV(r.id)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="gap-1" onClick={()=>openDetails(r.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
          <Card className="md:col-span-1 border-primary/30">
            <CardHeader>
              <CardTitle>Patient Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedReq.patientName || `Patient ${selectedReq.userId}`}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Age:</span> <span className="font-medium">{selectedReq.patientProfile?.age ?? "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{selectedReq.patientProfile?.gender ?? "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Dosha:</span> <span className="font-medium">{selectedReq.patientDosha ?? "—"}</span></div>
                <div className="text-xs text-muted-foreground">Last viewed: {formatLV(selectedReq.id)}</div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Medical Details</div>
                {selectedReq.patientProfile ? (
                  <ul className="text-sm space-y-1">
                    {selectedReq.patientProfile.allergies && <li><span className="text-muted-foreground">Allergies:</span> {selectedReq.patientProfile.allergies}</li>}
                    {selectedReq.patientProfile.conditions && <li><span className="text-muted-foreground">Conditions:</span> {selectedReq.patientProfile.conditions}</li>}
                    {selectedReq.patientProfile.medications && <li><span className="text-muted-foreground">Medications:</span> {selectedReq.patientProfile.medications}</li>}
                    {selectedReq.patientProfile.habits && <li><span className="text-muted-foreground">Habits:</span> {selectedReq.patientProfile.habits}</li>}
                    {selectedReq.patientProfile.sleepPattern && <li><span className="text-muted-foreground">Sleep:</span> {selectedReq.patientProfile.sleepPattern}</li>}
                    {selectedReq.patientProfile.digestion && <li><span className="text-muted-foreground">Digestion:</span> {selectedReq.patientProfile.digestion}</li>}
                    {selectedReq.patientProfile.notes && <li><span className="text-muted-foreground">Notes:</span> {selectedReq.patientProfile.notes}</li>}
                    {!selectedReq.patientProfile.allergies && !selectedReq.patientProfile.conditions && !selectedReq.patientProfile.medications && !selectedReq.patientProfile.habits && !selectedReq.patientProfile.sleepPattern && !selectedReq.patientProfile.digestion && !selectedReq.patientProfile.notes && (
                      <li className="text-muted-foreground">No medical details provided.</li>
                    )}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No medical details provided.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-accent/30">
            <CardHeader>
              <CardTitle>Analysis & Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedReq.plan && selectedReq.plan.length ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-primary/10 p-3 text-sm">
                      <div className="text-muted-foreground">Total Calories</div>
                      <div className="text-xl font-bold">{selectedReq.plan.reduce((s,p)=>s+(p.calories||0),0)} kcal</div>
                    </div>
                    <div className="rounded-md bg-accent/10 p-3 text-sm">
                      <div className="text-muted-foreground">Meals Planned</div>
                      <div className="text-xl font-bold">{selectedReq.plan.length}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ChartContainer config={{ cal:{label:"Calories", color:"hsl(var(--primary))"} }}>
                      <BarChart data={selectedReq.plan.map(m=>({ time:m.time, cal:m.calories }))}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="cal" fill="var(--color-cal)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                    <ChartContainer config={{ water:{label:"Water", color:"hsl(var(--accent))"} }}>
                      <LineChart data={selectedReq.plan.map(m=>({ time:m.time, water:m.waterMl || 0 }))}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="water" stroke="var(--color-water)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </div>

                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Meal</TableHead>
                          <TableHead className="text-right">Calories</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReq.plan.map((m,i)=> (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{m.time}</TableCell>
                            <TableCell>{m.name}</TableCell>
                            <TableCell className="text-right">{m.calories}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="text-xs text-muted-foreground">No adherence events recorded yet. Start tracking to see progress over time.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-md bg-destructive/10 p-3 text-sm">
                    <div className="font-medium">Not sufficient data</div>
                    <div className="text-muted-foreground">No analysis available yet. Generate a diet plan and begin tracking the patient's progress.</div>
                  </div>
                  <Button onClick={()=>generatePlanFor(selectedReq.id)}>Generate Diet Plan</Button>
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  );
}
