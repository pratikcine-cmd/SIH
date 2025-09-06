import React from "react";
import { motion } from "framer-motion";
import { User as UserIcon, Stethoscope } from "lucide-react";

export const Hero: React.FC<{
  onLoginUser?: () => void;
  onRegisterUser?: () => void;
  onLoginDoctor?: () => void;
  onRegisterDoctor?: () => void;
}> = ({ onLoginUser, onRegisterUser, onLoginDoctor, onRegisterDoctor }) => {

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[377px] w-full"
    >
      {/* Subtle gradient overlay for readability: only behind content area */}

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-6 py-20">
        <div className="flex flex-col justify-center items-start text-white w-[53%] ml-[29px] mt-[27px] mb-auto text-left">
          <motion.h1
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl mt-[200px]"
            style={{ textShadow: "1px 1px 3px rgba(0, 0, 0, 1)", fontFamily: "Italiana, serif", letterSpacing: "-1.2px" }}
          >
            Balance Fitness & Ayurveda for a Healthier You
          </motion.h1>
          <motion.p
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="mt-3 max-w-[517px] text-white/85"
            style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial" }}
          >
            Calm, professional guidance blending workouts, nutrition, and Ayurvedic wisdom.
          </motion.p>

          {/* Options */}
          <div className="mt-6 grid gap-4 sm:max-w-md sm:grid-cols-2">
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              role="button"
              tabIndex={0}
              onClick={onLoginUser || onRegisterUser}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  (onLoginUser || onRegisterUser)?.();
                }
              }}
              className="group cursor-pointer rounded-2xl border bg-white p-5 text-foreground shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border bg-emerald-50 p-2"><UserIcon className="h-5 w-5 text-emerald-700" /></div>
                <div className="text-sm font-semibold">Continue as User</div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Personalized plans, tracking, and mindful guidance.</p>
            </motion.div>

            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.25 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              role="button"
              tabIndex={0}
              onClick={onLoginDoctor || onRegisterDoctor}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  (onLoginDoctor || onRegisterDoctor)?.();
                }
              }}
              className="group cursor-pointer rounded-2xl border bg-white p-5 text-foreground shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-sky-700/25 focus:outline-none focus:ring-2 focus:ring-sky-700/30 focus:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border bg-slate-100 p-2"><Stethoscope className="h-5 w-5 text-slate-800" /></div>
                <div className="text-sm font-semibold">Continue as Doctor</div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Consult requests, chat, and diet plan sharing.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
