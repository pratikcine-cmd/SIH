import React from "react";
import { motion } from "framer-motion";

export const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="bg-transparent py-8 text-white"
      style={{ textShadow: "0 1px 2px rgba(0,0,0,.55)" }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-6 md:grid-cols-3">
        {/* Left: brand */}
        <div className="flex items-center justify-center gap-3 md:justify-start">
          <div className="h-6 w-6 rounded-md bg-white/30" />
          <span className="text-base font-semibold">AyurWell</span>
        </div>

        {/* Center: nav */}
        <nav className="flex justify-center text-sm">
          <ul className="flex items-center gap-5">
            <li><a className="transition-colors hover:text-white hover:underline underline-offset-4" href="#">Home</a></li>
            <li><a className="transition-colors hover:text-white hover:underline underline-offset-4" href="#">About</a></li>
            <li><a className="transition-colors hover:text-white hover:underline underline-offset-4" href="#">Contact</a></li>
          </ul>
        </nav>

        {/* Right: copyright */}
        <div className="flex justify-center md:justify-end">
          <div className="text-sm text-white">© {new Date().getFullYear()} AyurWell. All rights reserved.</div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
