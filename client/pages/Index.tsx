import React from "react";
import Hero from "@/components/app/Hero";
import NavBar from "@/components/app/NavBar";
import Footer from "@/components/app/Footer";
import Testimonials from "@/components/app/Testimonials";

export default function Index() {
  const bgUrl = "https://images.pexels.com/photos/3621234/pexels-photo-3621234.jpeg";
  return (
    <div
      className="min-h-screen w-full bg-fixed bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      {/* Fixed gradient overlay above background, behind all content */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.45)_28%,rgba(0,0,0,0.2)_52%,transparent_82%)]" />

      <div className="relative z-10">
        <NavBar onGetStarted={() => window.location.assign("/login")} onSignIn={() => window.location.assign("/login")} />

        <Hero
          onLoginUser={() => window.location.assign("/login?role=user")}
          onRegisterUser={() => window.location.assign("/login?role=user")}
          onLoginDoctor={() => window.location.assign("/login?role=doctor")}
          onRegisterDoctor={() => window.location.assign("/login?role=doctor")}
        />

        <Testimonials />
        <Footer />
      </div>
    </div>
  );
}
