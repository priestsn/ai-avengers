import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HaridDigitalAvatarProps {
  speaking: boolean;
  thinking: boolean;
  listening: boolean;
  listeningLabel?: string;
}

export default function HaridDigitalAvatar({
  speaking,
  thinking,
  listening,
  listeningLabel = "In ascolto",
}: HaridDigitalAvatarProps) {
  const [blinkState, setBlinkState] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const jawAnimFrame = useRef(0);
  const blinkTimer = useRef<ReturnType<typeof setTimeout>>();

  const scheduleBlink = useCallback(() => {
    const delay = 2000 + Math.random() * 4000;
    blinkTimer.current = setTimeout(() => {
      setBlinkState(true);
      setTimeout(() => {
        setBlinkState(false);
        scheduleBlink();
      }, 120 + Math.random() * 60);
    }, delay);
  }, []);

  useEffect(() => {
    scheduleBlink();
    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, [scheduleBlink]);

  useEffect(() => {
    if (!speaking) {
      setMouthOpen(0);
      if (jawAnimFrame.current) cancelAnimationFrame(jawAnimFrame.current);
      return;
    }

    let phase = 0;
    const animate = () => {
      phase += 0.18 + Math.random() * 0.08;
      const base = Math.sin(phase) * 0.5 + 0.5;
      const noise = Math.sin(phase * 2.7) * 0.3;
      const combined = Math.max(0, Math.min(1, base + noise));
      setMouthOpen(combined);
      jawAnimFrame.current = requestAnimationFrame(animate);
    };
    jawAnimFrame.current = requestAnimationFrame(animate);
    return () => {
      if (jawAnimFrame.current) cancelAnimationFrame(jawAnimFrame.current);
    };
  }, [speaking]);

  const eyeHeight = blinkState ? 0.5 : 6;
  const mouthHeight = 2 + mouthOpen * 6;
  const mouthWidth = 14 + mouthOpen * 4;
  const mouthRx = listening && !speaking ? 8 : mouthOpen > 0.3 ? 6 : 8;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500/5"
            style={{
              width: 2 + Math.random() * 4,
              height: 2 + Math.random() * 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20 - Math.random() * 30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative"
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          viewBox="0 0 120 140"
          className="w-48 h-56 md:w-56 md:h-64"
          style={{ filter: "drop-shadow(0 4px 20px rgba(59, 130, 246, 0.15))" }}
        >
          <defs>
            <radialGradient id="faceGrad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#d4a574" />
              <stop offset="70%" stopColor="#c4956a" />
              <stop offset="100%" stopColor="#b08460" />
            </radialGradient>
            <radialGradient id="headGlow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#16162a" />
            </linearGradient>
            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="125" rx="30" ry="18" fill="url(#suitGrad)" stroke="#334155" strokeWidth="0.5" />
          <rect x="52" y="108" width="16" height="14" rx="3" fill="url(#faceGrad)" />
          <path d="M 55 118 L 58 124 L 60 120 L 62 124 L 65 118" fill="none" stroke="#475569" strokeWidth="0.6" />

          <ellipse cx="60" cy="65" rx="32" ry="40" fill="url(#faceGrad)" />
          <ellipse cx="60" cy="65" rx="32" ry="40" fill="url(#headGlow)" />

          <path
            d="M 28 55 Q 28 20 60 18 Q 92 20 92 55 L 92 45 Q 90 28 60 25 Q 30 28 28 45 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 28 50 Q 26 38 30 30 Q 28 42 30 50 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 92 50 Q 94 38 90 30 Q 92 42 90 50 Z"
            fill="url(#hairGrad)"
          />

          <g>
            <ellipse cx="46" cy="58" rx="5" ry="5" fill="white" />
            <motion.ellipse
              cx="46" cy="58" rx="2.5" ry="2.5"
              fill="#1e3a5f"
              animate={thinking ? { cx: [45, 47, 45] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="44.5" cy="57" r="0.8" fill="white" opacity="0.8" />
            <motion.rect
              x="41" y="55.5"
              width="10"
              rx="5"
              fill="url(#faceGrad)"
              animate={{ height: eyeHeight }}
              transition={{ duration: 0.1 }}
            />
          </g>

          <g>
            <ellipse cx="74" cy="58" rx="5" ry="5" fill="white" />
            <motion.ellipse
              cx="74" cy="58" rx="2.5" ry="2.5"
              fill="#1e3a5f"
              animate={thinking ? { cx: [73, 75, 73] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="72.5" cy="57" r="0.8" fill="white" opacity="0.8" />
            <motion.rect
              x="69" y="55.5"
              width="10"
              rx="5"
              fill="url(#faceGrad)"
              animate={{ height: eyeHeight }}
              transition={{ duration: 0.1 }}
            />
          </g>

          <path
            d="M 42 48 Q 46 45 50 47"
            fill="none" stroke="#5a4a3a" strokeWidth="1.2" strokeLinecap="round"
          />
          <path
            d="M 70 47 Q 74 45 78 48"
            fill="none" stroke="#5a4a3a" strokeWidth="1.2" strokeLinecap="round"
          />

          <path
            d="M 52 70 Q 60 72 68 70"
            fill="none" stroke="#a0846a" strokeWidth="1" strokeLinecap="round"
          />

          <motion.ellipse
            cx="60" cy="82"
            fill="#c0584a"
            stroke="#a04a3e"
            strokeWidth="0.5"
            animate={{
              rx: mouthWidth / 2,
              ry: mouthHeight / 2,
            }}
            transition={{ duration: 0.05 }}
          />
          {mouthOpen > 0.4 && (
            <ellipse cx="60" cy="83.5" rx="5" ry="1.5" fill="#8b3a30" opacity="0.6" />
          )}
          {!speaking && !thinking && (
            <motion.path
              d="M 53 82 Q 60 86 67 82"
              fill="none"
              stroke="#c0584a"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: listening ? 1 : 0.6 }}
            />
          )}

          <ellipse cx="42" cy="70" rx="6" ry="3.5" fill="#d4a574" opacity="0.3" />
          <ellipse cx="78" cy="70" rx="6" ry="3.5" fill="#d4a574" opacity="0.3" />
        </svg>
      </motion.div>

      <AnimatePresence>
        {speaking && (
          <motion.div
            key="speaking-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 border-2 border-blue-400/20 rounded-2xl" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-blue-500/8 to-transparent" />

            <motion.div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-blue-400/70"
                  animate={{
                    height: ["4px", `${12 + Math.random() * 10}px`, "4px"],
                  }}
                  transition={{
                    duration: 0.4 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {thinking && (
          <motion.div
            key="thinking-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/15 rounded-2xl" />
            <motion.div
              className="absolute top-3 right-3 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-yellow-400/70"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {listening && !speaking && !thinking && (
          <motion.div
            key="listening-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2"
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-emerald-400"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-xs text-emerald-400/80 font-medium">{listeningLabel}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" />
    </div>
  );
}
