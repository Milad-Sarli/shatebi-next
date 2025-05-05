"use client"
import Aurora from "@/components/reactbit/backgrounds/Aurora/Aurora";
import BlurText from "@/components/reactbit/texts/BlurText";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
 <div className="flex flex-col items-center justify-center h-screen text-4xl" dir="rtl">
  <div className="absolute top-0 left-0 w-full h-full">
  <Aurora
  colorStops={["#00CFFF", "#6CF964", "#00CFFF"]}
  blend={0.2}
  amplitude={0.9}
  speed={0.5}
  />
  </div>
  <BlurText
    text="سامانه جامع آموزشی شاطبی"
    delay={150}
    animateBy="words"
    direction="top"
    className="md:text-7xl text-4xl mb-8 font-bold text-center mx-auto px-5 space-y-10"
    animationFrom={{ filter: 'blur(10px)', opacity: 0, y: -50 }}
    animationTo={[
      { filter: 'blur(5px)', opacity: 0.5, y: 5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ]}
    onAnimationComplete={() => {}}
  />
<Link href="/dashboard" className="relative group">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.5 }}
    className="relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-lg px-6 py-3 text-lg font-semibold text-black shadow-lg transition-all duration-300 hover:bg-white/20"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <span className="relative z-10 flex items-center gap-2">
      ورود به داشبورد
      <ArrowLeft className="h-5 w-5" />
    </span>
  </motion.div>
</Link>

 </div>
  );
}
