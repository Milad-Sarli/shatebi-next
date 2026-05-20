'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface FireworksEffectProps {
  show: boolean;
  onComplete?: () => void;
}

export function FireworksEffect({ show, onComplete }: FireworksEffectProps) {
  useEffect(() => {
    if (!show) return;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        onComplete?.();
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.3, 0.7) },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8E53', '#FF69B4', '#00D2FF', '#FFD700', '#32CD32'],
      });
      confetti({
        ...defaults,
        particleCount: particleCount * 0.5,
        origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.3, 0.7) },
        colors: ['#7B68EE', '#FF1493', '#FF4500', '#00FF7F'],
        startVelocity: 50,
      });
    }, 250);

    return () => clearInterval(interval);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="bg-green-500 text-white px-10 py-5 rounded-2xl shadow-2xl text-xl font-bold pointer-events-auto"
          >
            ثبت نام با موفقیت انجام شد 🎉
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
