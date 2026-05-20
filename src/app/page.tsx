"use client"
import Aurora from "@/components/reactbit/backgrounds/Aurora/Aurora";
import BlurText from "@/components/reactbit/texts/BlurText";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
 <div className="flex flex-col items-center justify-center min-h-screen text-4xl" dir="rtl">
  <div className="absolute top-0 left-0 w-full h-full">
  <Aurora
  colorStops={["#00CFFF", "#6CF964", "#00CFFF"]}
  blend={0.2}
  amplitude={0.9}
  speed={0.5}
  />
  </div>

  <div className="relative z-10 flex flex-col items-center gap-10 px-4 w-full max-w-4xl mx-auto">
    <BlurText
      text="سامانه جامع آموزشی شاطبی"
      delay={150}
      animateBy="words"
      direction="top"
      className="md:text-7xl text-4xl font-bold text-center"
      animationFrom={{ filter: 'blur(10px)', opacity: 0, y: -50 }}
      animationTo={[
        { filter: 'blur(5px)', opacity: 0.5, y: 5 },
        { filter: 'blur(0px)', opacity: 1, y: 0 }
      ]}
      onAnimationComplete={() => {}}
    />

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="w-full max-w-xs"
    >
      <Link href="/registeration/1" className="block">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-[2px] shadow-[0_0_30px_rgba(16,185,129,0.3)] group"
        >
          <div className="relative rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_60%)]" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-lg"
            />
            <div className="relative z-10 flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  ثبت نام
                </h3>
                <p className="text-sm text-green-100/90">
                  دارالقرآن امام شاطبی (رح)
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </motion.div>
      </Link>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3"
      >
        برای ثبت نام کلیک کنید
      </motion.p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3, duration: 0.5 }}
    >
      <Link href="/dashboard" className="relative group">
        <motion.div
          className="relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-lg px-6 py-3 text-lg font-semibold text-black dark:text-white shadow-lg transition-all duration-300 hover:bg-white/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            ورود به داشبورد
            <ArrowLeft className="h-5 w-5" />
          </span>
        </motion.div>
      </Link>
    </motion.div>
  </div>

 </div>
  );
}
