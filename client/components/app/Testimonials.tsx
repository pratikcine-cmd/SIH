import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Riya S.",
    role: "Product Designer",
    text: "The most calming, minimal fitness app I’ve used. It keeps me consistent without distractions.",
  },
  {
    name: "Arjun P.",
    role: "Engineer",
    text: "Clean UI, clear guidance. I love the gentle streaks and simple meal plans.",
  },
  {
    name: "Neha G.",
    role: "Founder",
    text: "Feels premium and professional. Exactly the minimalist vibe I was looking for.",
  },
];

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-sm font-medium text-foreground/80">
    {name.split(" ").map((n) => n[0]).join("")}
  </div>
);

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>Loved by a thoughtful community</h2>
        <p className="mt-2 text-sm text-white/85" style={{ textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>Minimal, focused, and designed to last.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div key={i} initial={{ y: 12, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.05 * i }}>
            <Card className="flex h-full flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar name={t.name} />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
              <p className="text-sm text-foreground/80">“{t.text}”</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
