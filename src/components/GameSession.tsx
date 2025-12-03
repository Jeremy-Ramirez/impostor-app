"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import PlayerListHorizontal from "@/components/PlayerListHorizontal";
import { passTurnAction, decideNextStepAction } from "@/actions/game-turn-actions";
import { Loader2, Mic, RotateCcw, Vote } from "lucide-react";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  created_at: string;
}

interface GameSessionProps {
  roomCode: string;
  initialPlayers: Player[];
  myPlayerId: string;
  initialTurnIndex: number;
  initialRoundState: string;
}

export default function GameSession({
  roomCode,
  initialPlayers,
  myPlayerId,
  initialTurnIndex,
  initialRoundState,
}: GameSessionProps) {
  const supabase = createClient();
  const router = useRouter();
  
  // Sort players by created_at to match server logic
  const [players, setPlayers] = useState<Player[]>(
    [...initialPlayers].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  );
  
  const [currentTurnIndex, setCurrentTurnIndex] = useState(initialTurnIndex);
  const [roundState, setRoundState] = useState(initialRoundState);
  const [isPending, startTransition] = useTransition();

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game_session_${roomCode}`)
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${roomCode}` },
        (payload: { new: { current_turn_index: number; round_state: string; status: string } }) => {
          if (payload.new.current_turn_index !== undefined) {
            setCurrentTurnIndex(payload.new.current_turn_index);
          }
          if (payload.new.round_state) {
            setRoundState(payload.new.round_state);
          }
          if (payload.new.status === "voting") {
             router.push(`/game/${roomCode}/vote`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, supabase, router]);

  const activePlayer = players[currentTurnIndex];
  const isMyTurn = activePlayer?.id === myPlayerId;
  const isHost = players.find(p => p.id === myPlayerId)?.is_host;

  const handlePassTurn = () => {
    startTransition(async () => {
      await passTurnAction(roomCode);
    });
  };

  const handleDecision = (decision: "NEW_ROUND" | "VOTE") => {
    startTransition(async () => {
      await decideNextStepAction(roomCode, decision);
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      
      {/* Turn Status / Round Status */}
      <div className="text-center min-h-[80px] flex flex-col items-center justify-center">
        {roundState === "TURN_LOOP" && activePlayer ? (
          <>
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Turno de</p>
            <h2 className="text-3xl font-black text-white animate-in fade-in slide-in-from-bottom-2">
              {activePlayer.name}
            </h2>
          </>
        ) : roundState === "ROUND_FINISHED" ? (
          <h2 className="text-2xl font-bold text-yellow-400 animate-pulse">
            Ronda Finalizada
          </h2>
        ) : null}
      </div>

      {/* Player List */}
      <PlayerListHorizontal 
        players={players} 
        myPlayerId={myPlayerId}
        activePlayerId={roundState === "TURN_LOOP" ? activePlayer?.id : undefined}
      />

      {/* Actions Area */}
      <div className="w-full max-w-md px-6 pb-6 min-h-[100px] flex items-center justify-center">
        
        {/* Case 1: My Turn */}
        {roundState === "TURN_LOOP" && isMyTurn && (
          <button
            onClick={handlePassTurn}
            disabled={isPending}
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-impostor-primary to-purple-600 text-white font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 animate-in zoom-in duration-300"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Mic className="w-6 h-6" />}
            TERMINAR MI TURNO
          </button>
        )}

        {/* Case 2: Round Finished (Host) */}
        {roundState === "ROUND_FINISHED" && isHost && (
          <div className="flex gap-4 w-full animate-in slide-in-from-bottom-4">
            <button
              onClick={() => handleDecision("NEW_ROUND")}
              disabled={isPending}
              className="flex-1 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all flex flex-col items-center gap-2"
            >
              <RotateCcw className="w-6 h-6 text-blue-400" />
              Otra Ronda
            </button>
            <button
              onClick={() => handleDecision("VOTE")}
              disabled={isPending}
              className="flex-1 py-4 rounded-xl bg-impostor-secondary text-white font-bold hover:bg-impostor-secondary-hover transition-all flex flex-col items-center gap-2 shadow-lg"
            >
              <Vote className="w-6 h-6" />
              Ir a Votar
            </button>
          </div>
        )}

        {/* Case 3: Round Finished (Non-Host) */}
        {roundState === "ROUND_FINISHED" && !isHost && (
          <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
            <p className="text-gray-400">Esperando decisión del Host...</p>
          </div>
        )}

      </div>
    </div>
  );
}
