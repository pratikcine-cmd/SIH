import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MessageCircle, Salad, ScanLine, Stethoscope, ChefHat, BarChart3, LayoutDashboard, LogOut } from "lucide-react";
import React from "react";
import { useAppState } from "@/context/app-state";
import { ChatWidget } from "./ChatWidget";

export const AppLayout: React.FC = () => {
  const { currentUser, setCurrentUser } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  const isDoctor = currentUser?.role === "doctor";
  const menu = isDoctor
    ? [
        { to: "/doctor", label: "Doctor Panel", icon: Stethoscope },
        { to: "/doctor/messages", label: "Messages", icon: MessageCircle },
      ]
    : [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/diet-plan", label: "Diet Plan", icon: Salad },
        { to: "/tracking", label: "Tracking", icon: BarChart3 },
        { to: "/recipes", label: "Recipes", icon: ChefHat },
        { to: "/scan", label: "Scan", icon: ScanLine },
      ];

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded-md bg-[#0FA36B]" />
            <div>
              <div className="text-sm font-semibold tracking-tight">AyurWell</div>
              <div className="text-xs text-muted-foreground">Holistic Nutrition</div>
            </div>
          </div>
          <SidebarSeparator />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {menu.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.to}>
                    <NavLink to={item.to} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {currentUser?.name?.slice(0, 2).toUpperCase() || "AY"}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <div className="text-sm font-medium">{currentUser?.name || "Guest"}</div>
                <div className="text-xs text-muted-foreground">{currentUser?.role ?? "unauthenticated"}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentUser(null);
                navigate("/");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Topbar />
        <div className="px-4 pb-8">
          <Outlet />
        </div>
      </SidebarInset>
      <ChatWidget />
    </SidebarProvider>
  );
};

const Topbar: React.FC = () => {
  const { currentUser } = useAppState();
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 h-6" />
      <div className="font-semibold">{currentUser?.role === "doctor" ? "Doctor Dashboard" : "AyurWell"}</div>
      <div className="ml-auto flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Assistant
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[420px]">
            <SheetHeader>
              <SheetTitle>Assistant</SheetTitle>
            </SheetHeader>
            <div className="py-4 text-sm text-muted-foreground">
              Use the floating chat bubble to interact. This panel can host future settings.
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
