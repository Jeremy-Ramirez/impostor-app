"use client";

import { restartGameAction } from "@/actions/restart-game";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, User, Loader2, ArrowRight, RotateCcw } from "lucide-react";

interface Player {
  id: string;
  name: string;
  is_eliminated: boolean;
  is_impostor: boolean;
  is_host: boolean;
}

interface Room {
  status: string;
  winner: string | null;
  last_eliminated_id: string | null;
}

interface ResultsClientProps {
  roomCode: string;
  room: Room;
  players: Player[];
  myPlayerId: string;
}

export default function ResultsClient({ roomCode, room, players, myPlayerId }: ResultsClientProps) {
  const router = useRouter();
  const [showReveal, setShowReveal] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [isPending, startTransition] = useTransition();

  const lastEliminatedPlayer = players.find(p => p.id === room.last_eliminated_id);
  const isGameOver = room.status === "GAME_OVER";
  const isVictory = isGameOver && room.winner === "VILLAGERS";
  const isDefeat = isGameOver && room.winner === "IMPOSTORS";
  const isContinue = !isGameOver; // status 'playing' or 'turn_loop'

  const myPlayer = players.find(p => p.id === myPlayerId);
  const isHost = myPlayer?.is_host;

  const handleRestart = () => {
    startTransition(async () => {
      await restartGameAction(roomCode);
    });
  };

  // Suspense effect for Continue scenario
  useEffect(() => {
    console.log("[ResultsClient] Mounted. Status:", room.status, "Winner:", room.winner);
    if (isContinue) {
      console.log("[ResultsClient] Game continues. Starting suspense timer...");
      const timer = setTimeout(() => {
        console.log("[ResultsClient] Revealing result...");
        setShowReveal(true);
      }, 2000); // 2 seconds suspense
      return () => clearTimeout(timer);
    } else {
      console.log("[ResultsClient] Game Over. Immediate reveal.");
      setShowReveal(true); // Immediate reveal for Game Over
    }
  }, [isContinue, room.status, room.winner]);

  // Realtime Subscription for "Play Again"
  useEffect(() => {
    if (!isGameOver) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room_results_${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${roomCode}`,
        },
        (payload: any) => {
          if (payload.new.status === "playing") {
            router.push(`/game/${roomCode}/play`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, isGameOver, router]);

  // Auto-redirect for Continue scenario
  useEffect(() => {
    if (isContinue && showReveal) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isContinue, showReveal]);

  // Trigger navigation when countdown hits 0
  useEffect(() => {
    if (isContinue && showReveal && countdown === 0) {
      router.push(`/game/${roomCode}/play`);
    }
  }, [isContinue, showReveal, countdown, roomCode, router]);

  const containerVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const contentVariants: import("framer-motion").Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: "spring", bounce: 0.5 } },
  };

  // SCENARIO 1: VICTORY
  if (isVictory) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 to-green-600 text-white p-6"
      >
        <motion.div variants={contentVariants} className="text-center space-y-8">
          <Trophy className="w-32 h-32 mx-auto text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
          <div>
            <h1 className="text-6xl font-black tracking-tighter mb-4 drop-shadow-lg">¡VICTORIA!</h1>
            <p className="text-2xl font-medium opacity-90">El Impostor ha sido eliminado.</p>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push("/")}
              className="px-8 py-4 bg-white text-green-700 font-bold rounded-full text-xl shadow-xl hover:scale-105 transition-transform"
            >
              Volver al Lobby
            </button>
            {isHost && (
              <button 
                onClick={handleRestart}
                disabled={isPending}
                className="px-8 py-4 bg-green-800 text-white font-bold rounded-full text-xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 border border-green-400/30"
              >
                {isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                Jugar de Nuevo
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // SCENARIO 2: DEFEAT
  if (isDefeat) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 to-red-700 text-white p-6"
      >
        <motion.div variants={contentVariants} className="text-center space-y-8">
          <Skull className="w-32 h-32 mx-auto text-black/50 drop-shadow-lg" />
          <div>
            <h1 className="text-6xl font-black tracking-tighter mb-4 drop-shadow-lg text-red-200">DERROTA</h1>
            <p className="text-2xl font-medium opacity-90">Los Impostores han ganado.</p>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push("/")}
              className="px-8 py-4 bg-red-950 text-red-200 font-bold rounded-full text-xl shadow-xl hover:scale-105 transition-transform border border-red-500/30"
            >
              Volver al Lobby
            </button>
             {isHost && (
              <button 
                onClick={handleRestart}
                disabled={isPending}
                className="px-8 py-4 bg-red-800 text-white font-bold rounded-full text-xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 border border-red-400/30"
              >
                {isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                Jugar de Nuevo
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // SCENARIO 3: CONTINUE (Suspense -> Reveal)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 animate-pulse" />

      <AnimatePresence mode="wait">
        {!showReveal ? (
          <motion.div
            key="suspense"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="text-center space-y-6 z-10"
          >
            <Loader2 className="w-24 h-24 mx-auto text-indigo-500 animate-spin" />
            <h2 className="text-3xl font-bold tracking-widest animate-pulse">PROCESANDO VOTOS...</h2>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-center space-y-8 z-10 max-w-lg w-full"
          >
            {lastEliminatedPlayer ? (
              <>
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-slate-800 rounded-full w-full h-full flex items-center justify-center border-4 border-indigo-500/30">
                    <User className="w-16 h-16 text-indigo-300" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-2 shadow-lg">
                    <Skull className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white drop-shadow-lg">
                    {lastEliminatedPlayer.name}
                  </h2>
                  <p className="text-2xl text-indigo-200 font-medium">
                    ha sido expulsado.
                  </p>
                </div>

                <div className="py-6">
                  <div className={`text-3xl font-bold px-6 py-3 rounded-xl inline-block ${
                    lastEliminatedPlayer.is_impostor 
                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-green-500/20 text-green-400 border border-green-500/50"
                  }`}>
                    {lastEliminatedPlayer.is_impostor ? "ERA EL IMPOSTOR" : "ERA UN ALDEANO"}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="w-32 h-32 mx-auto bg-slate-800 rounded-full flex items-center justify-center border-4 border-gray-600">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
                <h2 className="text-4xl font-black text-gray-300">NADIE FUE EXPULSADO</h2>
                <p className="text-xl text-gray-500">La votación terminó en empate o se saltó.</p>
              </div>
            )}

            <div className="pt-12 flex flex-col items-center gap-3 opacity-80">
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden max-w-xs">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="h-full bg-indigo-500"
                />
              </div>
              <p className="text-sm text-indigo-300 flex items-center gap-2">
                Siguiente ronda en {countdown}s <ArrowRight className="w-4 h-4" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
