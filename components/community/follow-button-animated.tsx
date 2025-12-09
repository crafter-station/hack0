"use client";

import { motion } from "framer-motion";

interface FollowButtonAnimatedProps {
  isFollowing: boolean;
  showSuccess: boolean;
}

export function FollowButtonAnimated({ isFollowing, showSuccess }: FollowButtonAnimatedProps) {
  return (
    <>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        {/* User icon - always visible */}
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0" />

        {/* Plus sign - morphs out on success */}
        <motion.g
          animate={{
            scale: showSuccess ? 0 : 1,
            opacity: showSuccess ? 0 : 1,
          }}
          transition={{ duration: 0.15 }}
        >
          <motion.line
            x1="19"
            y1="8"
            x2="19"
            y2="14"
            animate={isFollowing ? {
              y1: [8, 9.5, 8],
              y2: [14, 12.5, 14],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: isFollowing ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
          <motion.line
            x1="16"
            y1="11"
            x2="22"
            y2="11"
            animate={isFollowing ? {
              x1: [16, 17.5, 16],
              x2: [22, 20.5, 22],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: isFollowing ? Infinity : 0,
              ease: "easeInOut",
              delay: 0.05
            }}
          />
        </motion.g>

        {/* Checkmark - morphs in on success */}
        <motion.polyline
          points="17 9 19 11 22 8"
          animate={{
            pathLength: showSuccess ? 1 : 0,
            opacity: showSuccess ? 1 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeOut"
          }}
        />
      </svg>
      <span className="inline-block">
        {showSuccess ? "Siguiendo" : isFollowing ? "Siguiendo..." : "Seguir"}
      </span>
    </>
  );
}
