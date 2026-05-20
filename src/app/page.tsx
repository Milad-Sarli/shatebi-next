"use client"
import Aurora from "@/components/reactbit/backgrounds/Aurora/Aurora";
import BlurText from "@/components/reactbit/texts/BlurText";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, GraduationCap } from "lucide-react";
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

  <div className="relative z-10 flex flex-col items-center gap-8 px-4 w-full max-w-4xl mx-auto">
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
      className="w-full max-w-md"
    >
      <p className="text-lg text-center text-gray-700 dark:text-gray-300 mb-6">
        فرم ثبت نام متقاضیان
      </p>
      <Link
        href="/registeration/1"
        className="group block relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 p-5 text-right transition-all duration-300 hover:bg-white/20 hover:border-green-400/30 hover:shadow-lg hover:shadow-green-500/10"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-green-500/20 rounded-full p-2.5 group-hover:bg-green-500/30 transition-colors">
            <GraduationCap className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-black dark:text-white group-hover:text-green-400 transition-colors">
              دارالقرآن امام شاطبی (رح)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
              ثبت نام جدید
            </p>
          </div>
          <UserPlus className="w-5 h-5 text-gray-500 group-hover:text-green-400 transition-colors" />
        </div>
      </Link>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
    >
      <Link href="/dashboard" className="relative group">
        <motion.div
          className="relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-lg px-6 py-3 text-lg font-semibold text-black shadow-lg transition-all duration-300 hover:bg-white/20"
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
