'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Pacifico } from 'next/font/google';

const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] });

export default function Home() {
  const { isSignedIn, user } = useUser();
  const bgRef = useRef([]);
  const [positions, setPositions] = useState([]);
  const [textIndex, setTextIndex] = useState(0);
  const pingText = 'Ping';

  // Generate random bubble positions
  useEffect(() => {
    const newPositions = Array.from({ length: 15 }).map(() => ({
      bottom: Math.random() * 100,
      left: Math.random() * 90,
    }));
    setPositions(newPositions);
  }, []);

  // Animate bubbles
  useEffect(() => {
    if (positions.length && bgRef.current.length) {
      bgRef.current.forEach((el, idx) => {
        if (!el) return;
        gsap.to(el, {
          y: -400 - Math.random() * 200,
          x: Math.random() * 300 - 150,
          opacity: 0.1 + Math.random() * 0.2,
          scale: 0.7 + Math.random() * 0.6,
          duration: 20 + Math.random() * 10,
          repeat: -1,
          yoyo: true,
          delay: idx * 0.3,
          ease: 'power1.inOut',
        });
      });
    }
  }, [positions]);

  // Auto typing "Ping"
  useEffect(() => {
    if (textIndex < pingText.length) {
      const timeout = setTimeout(() => setTextIndex(textIndex + 1), 160);
      return () => clearTimeout(timeout);
    }
  }, [textIndex]);

  // Signed-in UI
  if (isSignedIn) {
    return (
      <div className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 px-4 overflow-hidden">
        {/* Glow background */}
        <div className="absolute w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px] -z-10" />

        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className={`${pacifico.className} text-5xl sm:text-6xl md:text-7xl text-purple-700 mb-4 text-center`}
        >
          Welcome back, {user?.firstName || 'Friend'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-purple-800 mb-8 text-center text-lg sm:text-xl"
        >
          Ready to chat? Pick a room and start connecting.
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/chat">
            <motion.button
              whileHover={{ scale: 1.07, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-lg text-lg"
            >
              Enter Chat
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  // Signed-out UI
  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-100 flex flex-col items-center justify-center px-4">
      {/* Floating bubbles */}
      {positions.map((pos, i) => (
        <div
          key={i}
          ref={(el) => (bgRef.current[i] = el)}
          className="absolute w-8 sm:w-12 md:w-16 h-8 sm:h-12 md:h-16 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-30"
          style={{
            bottom: `${pos.bottom}px`,
            left: `${pos.left}%`,
          }}
        />
      ))}

      {/* Logo text typing */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, ease: [0.68, -0.55, 0.265, 1.55] }}
        className={`${pacifico.className} text-6xl sm:text-7xl md:text-8xl text-purple-700 z-10 text-center drop-shadow-lg`}
      >
        {pingText.slice(0, textIndex)}
        <span className="border-r-4 border-purple-700 animate-pulse ml-1" />
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl z-10 text-purple-800 text-center max-w-xl"
      >
        Real-time chat made simple. Connect instantly with anyone, anywhere.
      </motion.p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-10 z-10">
        <Link href="/sign-up">
          <motion.button
            whileHover={{ scale: 1.07, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-lg text-lg"
          >
            Sign Up
          </motion.button>
        </Link>
        <Link href="/sign-in">
          <motion.button
            whileHover={{ scale: 1.07, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 border border-purple-400 rounded-full font-semibold text-purple-700 shadow-md text-lg"
          >
            Sign In
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
