import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Role = "user" | "doctor";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  dosha?: "Vata" | "Pitta" | "Kapha" | null;
};

export type Progress = {
  waterMl: number;
  waterGoalMl: number;
  mealsPlanned: number;
  mealsTaken: number;
};

export type Meal = {
  time: string;
  name: string;
  calories: number;
  properties: string[]; // e.g., ["Hot", "Rasa: Madhura"]
};

export type DietPlan = {
  date: string;
  notes?: string;
  meals: Meal[];
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
};

export type PatientProfile = {
  age?: number;
  gender?: "Male" | "Female" | "Other";
  heightCm?: number;
  weightKg?: number;
  allergies?: string;
  conditions?: string;
  medications?: string;
  habits?: string;
  sleepPattern?: string;
  digestion?: "Poor" | "Normal" | "Strong" | string;
  notes?: string;
};

export type ConsultRequest = {
  id: string;
  userId: string;
  doctorId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  patientName?: string;
  patientDosha?: User["dosha"];
  plan?: { time: string; name: string; calories: number; waterMl?: number }[];
  patientProfile?: PatientProfile;
};

export type Notification = {
  id: string;
  type: "info" | "success" | "warning" | "doctor" | "diet" | "water";
  title: string;
  message: string;
  time: string;
  read?: boolean;
};

export type ChatMessage = {
  id: string;
  requestId: string;
  from: "doctor" | "patient" | "system";
  text: string;
  ts: number;
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export type AppState = {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  progress: Progress;
  setProgress: (p: Progress) => void;
  dietPlan: DietPlan | null;
  setDietPlan: (p: DietPlan | null) => void;
  doctors: Doctor[];
  requests: ConsultRequest[];
  setRequests: (r: ConsultRequest[]) => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "time" | "read">) => void;
  markAllRead: () => void;
  markNotificationRead: (id: string) => void;
  updateWater: (deltaMl: number) => void;
  markMealTaken: () => void;
  generateMockPlan: (overrides?: Partial<DietPlan>) => DietPlan;
  conversations: Record<string, ChatMessage[]>;
  addMessage: (
    requestId: string,
    msg: Omit<ChatMessage, "id" | "requestId" | "ts"> & { ts?: number },
  ) => void;
};

const AppStateContext = createContext<AppState | null>(null);

function makePlan(
  meals?: Partial<ConsultRequest["plan"]>,
): { time: string; name: string; calories: number; waterMl?: number }[] {
  return meals && Array.isArray(meals) && meals.length
    ? (meals as any)
    : [
        {
          time: "08:00",
          name: "Warm Spiced Oats",
          calories: 320,
          waterMl: 250,
        },
        {
          time: "12:30",
          name: "Moong Dal Khichdi",
          calories: 450,
          waterMl: 300,
        },
        {
          time: "19:30",
          name: "Steamed Veg + Ghee",
          calories: 420,
          waterMl: 250,
        },
      ];
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    load<User | null>("app:currentUser", null),
  );
  const [progress, setProgress] = useState<Progress>(() =>
    load<Progress>("app:progress", {
      waterMl: 0,
      waterGoalMl: 2500,
      mealsPlanned: 3,
      mealsTaken: 0,
    }),
  );
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(() =>
    load<DietPlan | null>("app:dietPlan", null),
  );
  const [doctors] = useState<Doctor[]>([
    {
      id: "d1",
      name: "Dr. Anaya Verma",
      specialty: "Ayurvedic Diet",
      rating: 4.9,
    },
    {
      id: "d2",
      name: "Dr. Rohan Mehta",
      specialty: "Digestive Health",
      rating: 4.7,
    },
    {
      id: "d3",
      name: "Dr. Kavya Iyer",
      specialty: "Metabolic Care",
      rating: 4.8,
    },
  ]);
  const [requests, setRequests] = useState<ConsultRequest[]>(() => {
    const loaded = load<ConsultRequest[]>("app:requests", []);
    if (loaded && loaded.length) return loaded;
    const seed: ConsultRequest[] = [
      {
        id: "req_1001",
        userId: "u1001",
        doctorId: "d1",
        status: "accepted",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        patientName: "Riya Sharma",
        patientDosha: "Pitta",
        plan: makePlan([
          {
            time: "08:00",
            name: "Lemon Ginger Tea",
            calories: 40,
            waterMl: 200,
          },
          { time: "13:00", name: "Veg Khichdi", calories: 420, waterMl: 300 },
          {
            time: "19:30",
            name: "Steamed Veg + Ghee",
            calories: 400,
            waterMl: 250,
          },
        ]),
      },
      {
        id: "req_1002",
        userId: "u1002",
        doctorId: "d1",
        status: "pending",
        createdAt: new Date().toISOString(),
        patientName: "Aarav Patel",
        patientDosha: "Vata",
      },
      {
        id: "req_1003",
        userId: "u1003",
        doctorId: "d1",
        status: "accepted",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        patientName: "Neha Gupta",
        patientDosha: "Kapha",
        plan: makePlan([
          { time: "08:30", name: "Warm Oats", calories: 320, waterMl: 250 },
          {
            time: "12:45",
            name: "Moong Dal Soup",
            calories: 380,
            waterMl: 300,
          },
          {
            time: "19:00",
            name: "Millet Roti + Veg",
            calories: 450,
            waterMl: 250,
          },
        ]),
      },
    ];
    return seed;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    load<Notification[]>("app:notifications", []),
  );
  const [conversations, setConversations] = useState<
    Record<string, ChatMessage[]>
  >(() => {
    const loaded = load<Record<string, ChatMessage[]>>("app:conversations", {});
    if (Object.keys(loaded).length) return loaded;
    const base: Record<string, ChatMessage[]> = {};
    const now = Date.now();
    base["req_1001"] = [
      {
        id: uid("msg"),
        requestId: "req_1001",
        from: "system",
        text: "Consultation started with Riya Sharma.",
        ts: now - 800000,
      },
      {
        id: uid("msg"),
        requestId: "req_1001",
        from: "patient",
        text: "Good morning, doctor!",
        ts: now - 790000,
      },
      {
        id: uid("msg"),
        requestId: "req_1001",
        from: "doctor",
        text: "Hello Riya, how are you feeling today?",
        ts: now - 780000,
      },
    ];
    base["req_1003"] = [
      {
        id: uid("msg"),
        requestId: "req_1003",
        from: "system",
        text: "Consultation started with Neha Gupta.",
        ts: now - 400000,
      },
      {
        id: uid("msg"),
        requestId: "req_1003",
        from: "patient",
        text: "I feel heavy after dinner.",
        ts: now - 300000,
      },
    ];
    return base;
  });

  useEffect(() => save("app:currentUser", currentUser), [currentUser]);
  useEffect(() => save("app:progress", progress), [progress]);
  useEffect(() => save("app:dietPlan", dietPlan), [dietPlan]);
  useEffect(() => save("app:requests", requests), [requests]);
  useEffect(() => save("app:notifications", notifications), [notifications]);
  useEffect(() => save("app:conversations", conversations), [conversations]);

  const addNotification = (n: Omit<Notification, "id" | "time" | "read">) => {
    setNotifications((prev) =>
      [
        { id: uid("ntf"), time: new Date().toISOString(), read: false, ...n },
        ...prev,
      ].slice(0, 50),
    );
  };
  const markAllRead = () => setNotifications((prev) => []);
  const markNotificationRead = (id: string) =>
    setNotifications((prev) => prev.filter((x) => x.id !== id));

  const updateWater = (deltaMl: number) => {
    setProgress((p) => ({
      ...p,
      waterMl: Math.max(0, Math.min(p.waterGoalMl, p.waterMl + deltaMl)),
    }));
    addNotification({
      type: "water",
      title: "Hydration logged",
      message: `+${deltaMl}ml water added.`,
    });
  };
  const markMealTaken = () => {
    setProgress((p) => ({
      ...p,
      mealsTaken: Math.min(p.mealsPlanned, p.mealsTaken + 1),
    }));
    addNotification({
      type: "diet",
      title: "Meal recorded",
      message: "Marked one meal as taken.",
    });
  };

  const generateMockPlan = (overrides?: Partial<DietPlan>): DietPlan => {
    const base: DietPlan = {
      date: new Date().toISOString().slice(0, 10),
      notes: "Personalized as per dosha balance with sattvic emphasis",
      meals: [
        {
          time: "08:00",
          name: "Warm Spiced Oats",
          calories: 320,
          properties: ["Warm", "Rasa: Madhura", "Sattvic"],
        },
        {
          time: "12:30",
          name: "Moong Dal Khichdi",
          calories: 450,
          properties: ["Light", "Tridoshic", "Sattvic"],
        },
        {
          time: "16:00",
          name: "Herbal Tea + Nuts",
          calories: 180,
          properties: ["Warm", "Rasa: Kashaya"],
        },
        {
          time: "19:30",
          name: "Steamed Veg + Ghee",
          calories: 420,
          properties: ["Light", "Grounding"],
        },
      ],
    };
    const plan = { ...base, ...overrides };
    setDietPlan(plan);
    addNotification({
      type: "diet",
      title: "Diet plan generated",
      message: `7-day plan for ${plan.date} created.`,
    });
    return plan;
  };

  const addMessage: AppState["addMessage"] = (requestId, msg) => {
    setConversations((prev) => {
      const next = { ...prev };
      const list = next[requestId] ? [...next[requestId]] : [];
      list.push({
        id: uid("msg"),
        requestId,
        from: msg.from,
        text: msg.text,
        ts: msg.ts ?? Date.now(),
      });
      next[requestId] = list.slice(-200);
      return next;
    });
  };

  const value = useMemo<AppState>(
    () => ({
      currentUser,
      setCurrentUser,
      progress,
      setProgress,
      dietPlan,
      setDietPlan,
      doctors,
      requests,
      setRequests,
      notifications,
      addNotification,
      markAllRead,
      markNotificationRead,
      updateWater,
      markMealTaken,
      generateMockPlan,
      conversations,
      addMessage,
    }),
    [
      currentUser,
      progress,
      dietPlan,
      doctors,
      requests,
      notifications,
      conversations,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
