import React from "react";
import { motion } from "framer-motion";

export const NavBar: React.FC<{ onGetStarted?: () => void; onSignIn?: () => void }> = () => {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background/70"
    />
  );
};

export default NavBar;
