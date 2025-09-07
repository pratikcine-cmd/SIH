import { useMemo, useState, useEffect } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ArrowUpRight } from "lucide-react";

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

  const openInPanel = (id: string) => {
    markViewed(id);
    navigate({ pathname: "/doctor", search: createSearchParams({ open: id }).toString() });
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
                  <TableHead className="hidden sm:table-cell">Req ID</TableHead>
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
                            <div className="text-xs text-muted-foreground">Recently viewed sorting</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="gap-1" onClick={()=>openInPanel(r.id)}>
                          View <ArrowUpRight className="h-3.5 w-3.5" />
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
    </div>
  );
}
