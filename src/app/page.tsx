"use client"
import Aurora from "@/components/reactbit/backgrounds/Aurora/Aurora";
import BlurText from "@/components/reactbit/texts/BlurText";

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
/>
 </div>
  );
}
