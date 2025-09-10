"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Chrome } from "lucide-react";
import { useAppState } from "@/context/app-state";
import { QUIZ } from "@/data/Quiz";

// —— Constants ——
const bgUrl = "https://images.pexels.com/photos/3621234/pexels-photo-3621234.jpeg";

// —— Schemas ——
// WhatsApp: exactly 10 digits
const personalSchema = z.object({
  name: z.string().min(2, "Name is required"),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  dob: z.string().min(1, "Date of birth is required"),
  whatsapp: z.string().regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits (numbers only)"),
  address: z.object({
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),
  }),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const quizSchema = z.object({
  // allow partial during steps; enforce completion on submit
  answers: z.record(z.string(), z.number().min(1).max(3)),
});

// Optional File with type check only when present
const medicalSchema = z.object({
  allergies: z.string().optional(),
  medicalDoc: z
    .custom<File | undefined>(
      (v) => v === undefined || (typeof File !== "undefined" && v instanceof File),
      "Invalid file"
    )
    .refine((file) => !file || file.type === "application/pdf", {
      message: "Only PDF files are allowed",
    })
    .optional(),
  conditionDesc: z.string().optional(),
});

const formSchema = z.object({
  personal: personalSchema,
  quiz: quizSchema,
  medical: medicalSchema,
});

type FormValues = z.infer<typeof formSchema>;

// —— Anim variants ——
const stepVariants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

// —— RHF field wrappers ——
function TextField({
  label,
  name,
  type = "text",
  placeholder,
  inputMode,
  pattern,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
}) {
  const { register, formState } = useFormContext();
  const error = formState.errors as any;
  const err = name.split(".").reduce((acc: any, key) => (acc ? acc[key] : undefined), error);
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} inputMode={inputMode} pattern={pattern} {...register(name as any)} />
      {err?.message && <p className="text-xs text-destructive">{String(err.message)}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { label: string; value: string }[];
}) {
  const { setValue, watch, formState } = useFormContext();
  const value = watch(name);
  const error = formState.errors as any;
  const err = name.split(".").reduce((acc: any, key) => (acc ? acc[key] : undefined), error);
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => setValue(name as any, v, { shouldValidate: true })}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {err?.message && <p className="text-xs text-destructive">{String(err.message)}</p>}
    </div>
  );
}

// —— Steps ——
// Step 1: Personal Details
function StepPersonal() {
  const { register, formState } = useFormContext();
  return (
    <div className="space-y-4">
      <TextField label="Name" name="personal.name" placeholder="Your full name" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Gender"
          name="personal.gender"
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
          ]}
        />
        <div className="grid gap-2">
          <Label>Date of Birth</Label>
          <div className="relative">
            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" className="pl-9" {...register("personal.dob")} />
          </div>
          {((formState.errors as any).personal?.dob?.message) && (
            <p className="text-xs text-destructive">{String((formState.errors as any).personal?.dob?.message)}</p>
          )}
        </div>
      </div>

      <TextField
        label="WhatsApp Number"
        name="personal.whatsapp"
        placeholder="10-digit number"
        inputMode="numeric"
        pattern="\d*"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField label="City" name="personal.address.city" placeholder="City" />
        <TextField label="State" name="personal.address.state" placeholder="State" />
        <TextField label="Country" name="personal.address.country" placeholder="Country" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Email" name="personal.email" type="email" placeholder="you@example.com" />
        <TextField label="Password" name="personal.password" type="password" placeholder="••••••••" />
      </div>
    </div>
  );
}

// Step 2: Quiz — 2 questions per screen
function StepQuiz({
  index,
  setIndex,
  onFinish,
}: {
  index: number; // 0..4
  setIndex: (n: number) => void;
  onFinish: () => void;
}) {
  const { setValue, watch, clearErrors } = useFormContext();
  const start = index * 2;
  const slice = QUIZ.slice(start, start + 2);

  const answers = watch("quiz.answers") || {};
  const setAnswer = (qid: number, val: 1 | 2 | 3) => {
    setValue(`quiz.answers.${String(qid)}`, val, { shouldValidate: false });
    clearErrors("quiz");
  };

  const canProceed = slice.every((q) => !!answers[String(q.id)]);

  const handleNext = () => {
    if (!canProceed) return;
    if (index < 4) setIndex(index + 1);
    else onFinish();
  };

  return (
    <div className="space-y-6">
      {slice.map((q) => {
        const current = answers[String(q.id)];
        return (
          <div key={q.id} className="rounded-lg border p-4 bg-accent/20 border-accent/40">
            <p className="font-medium mb-3">{q.q}</p>
            <div className="grid gap-2">
              {[q.a1, q.a2, q.a3].map((label, i) => {
                const opt = (i + 1) as 1 | 2 | 3;
                const active = current === opt;
                return (
                  <Button
                    key={opt}
                    type="button"
                    variant={active ? "secondary" : "outline"}
                    className={`justify-start h-10 ${active ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setAnswer(q.id, opt)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          Previous
        </Button>
        <Button type="button" onClick={handleNext} disabled={!canProceed}>
          {index < 4 ? "Next" : "Finish Quiz"}
        </Button>
      </div>
    </div>
  );
}

// Step 3: Medical Info (optional PDF)
function StepMedical({ onPdfChange }: { onPdfChange: React.ChangeEventHandler<HTMLInputElement> }) {
  const { register, formState } = useFormContext();
  const error = formState.errors as any;
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Allergies (if any)</Label>
        <Input placeholder="e.g., peanuts, pollen" {...register("medical.allergies")} />
      </div>
      <div className="grid gap-2">
        <Label>Medical Document (PDF only)</Label>
        <Input type="file" accept="application/pdf" onChange={onPdfChange} />
        {error?.medical?.medicalDoc?.message && (
          <p className="text-xs text-destructive">{String(error.medical.medicalDoc.message)}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label>Medical Condition Description (optional)</Label>
        <Textarea placeholder="Describe any medical condition you'd like to share" {...register("medical.conditionDesc")} />
      </div>
    </div>
  );
}

export default function Register() {
  const { setCurrentUser } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);
  const [quizScreen, setQuizScreen] = useState(0); // 0..4

  const role: "user" = "user";

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personal: {
        name: "",
        gender: undefined as any,
        dob: "",
        whatsapp: "",
        address: { city: "", state: "", country: "" },
        email: "",
        password: "",
      },
      quiz: { answers: {} },
      medical: {
        allergies: "",
        medicalDoc: undefined,
        conditionDesc: "",
      },
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, setError: setFormError, setValue, clearErrors } = methods;

  async function nextFromPersonal() {
    const ok = await trigger(["personal"]);
    if (!ok) return;
    setActiveStep(1);
  }

  function computeQuizCounts(answersRec: Record<string, number>) {
    const counts = { opt1: 0, opt2: 0, opt3: 0 };
    QUIZ.forEach((q) => {
      const v = answersRec[String(q.id)];
      if (v === 1) counts.opt1 += 1;
      else if (v === 2) counts.opt2 += 1;
      else if (v === 3) counts.opt3 += 1;
    });
    return counts;
  }

  function determineDosha(counts: { opt1: number; opt2: number; opt3: number }) {
    const { opt1, opt2, opt3 } = counts;
    if (opt1 >= opt2 && opt1 >= opt3) return "Vata" as const;
    if (opt2 >= opt1 && opt2 >= opt3) return "Pitta" as const;
    return "Kapha" as const;
  }

  // Correct file handler: use currentTarget and optional chaining index
  const handlePdfChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0] || undefined;
    clearErrors("medical.medicalDoc");
    setValue("medical.medicalDoc", file as any, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  async function finalizeRegistration(values: FormValues) {
    try {
      const { personal, quiz, medical } = values;

      // Enforce all 10 answers at submit
      if (Object.keys(quiz.answers || {}).length !== 10) {
        setFormError("quiz" as any, { type: "manual", message: "Please answer all 10 questions" });
        setActiveStep(1);
        return;
      }

      const counts = computeQuizCounts(quiz.answers as any);
      const dosha = determineDosha(counts);

      setCurrentUser({
        id: `u_${Date.now()}`,
        name: personal.name,
        email: personal.email,
        role,
        dosha,
        meta: {
          gender: personal.gender,
          dob: personal.dob,
          whatsapp: personal.whatsapp,
          address: personal.address,
          quizCounts: counts,
          medical: {
            allergies: medical.allergies,
            conditionDesc: medical.conditionDesc,
            hasPdf: !!medical.medicalDoc,
          },
        },
      });

      window.location.assign("/dashboard");
      console.log("Quiz option counts:", counts, "Dosha:", dosha);
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen w-full bg-fixed bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})` }}>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.45)_28%,rgba(0,0,0,0.2)_52%,transparent_82%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-2xl">
          <Card className="rounded-2xl border bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Sign up as user</p>
                </div>
                <a href="/login" className="text-sm underline-offset-4 hover:underline">
                  Already registered? Sign in
                </a>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </motion.div>
              )}

              {/* Stepper header */}
              <div className="mb-6 grid grid-cols-3 gap-2">
                {["Personal", "Quiz", "Medical"].map((label, i) => {
                  const status = i < activeStep ? "complete" : i === activeStep ? "active" : "upcoming";
                  return (
                    <motion.div
                      key={label}
                      className="rounded-full border px-3 py-2 text-center text-xs sm:text-sm"
                      animate={{
                        backgroundColor: status === "complete" ? "hsl(var(--muted))" : status === "active" ? "hsl(var(--accent))" : "hsl(var(--card))",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {label}
                    </motion.div>
                  );
                })}
              </div>

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(finalizeRegistration)} className="space-y-6">
                  <AnimatePresence mode="wait" initial={false}>
                    {activeStep === 0 && (
                      <motion.div key="step-1" variants={stepVariants} initial="initial" animate="enter" exit="exit" transition={{ duration: 0.25 }}>
                        <StepPersonal />
                        <div className="mt-6 flex justify-end">
                          <Button type="button" className="rounded-full" onClick={nextFromPersonal}>
                            Continue to Quiz
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 1 && (
                      <motion.div key="step-2" variants={stepVariants} initial="initial" animate="enter" exit="exit" transition={{ duration: 0.25 }}>
                        <StepQuiz index={quizScreen} setIndex={setQuizScreen} onFinish={() => setActiveStep(2)} />
                      </motion.div>
                    )}

                    {activeStep === 2 && (
                      <motion.div key="step-3" variants={stepVariants} initial="initial" animate="enter" exit="exit" transition={{ duration: 0.25 }}>
                        <StepMedical onPdfChange={handlePdfChange} />
                        <div className="mt-6 flex items-center justify-between">
                          <Button type="button" variant="ghost" onClick={() => setActiveStep(1)}>
                            Back to Quiz
                          </Button>
                          <Button type="submit" className="rounded-full">Create account</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
