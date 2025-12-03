"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { submitVoteAction } from "@/actions/submit-vote";
import { User, Skull, CheckCircle2, AlertTriangle, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  name: string;
  is_eliminated: boolean;
  voted_for_id: string | null;
}

interface VotingClientProps {
  roomCode: string;
  players: Player[];
  myPlayerId: string;
}

export default function VotingClient({ roomCode, players: initialPlayers, myPlayerId }: VotingClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isPending, startTransition] = useTransition();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const myPlayer = players.find(p => p.id === myPlayerId);
  const amIEliminated = myPlayer?.is_eliminated;
  const hasVoted = myPlayer?.voted_for_id !== null;

  const alivePlayers = players.filter(p => !p.is_eliminated);
  const votesCast = alivePlayers.filter(p => p.voted_for_id !== null).length;
  const totalAlive = alivePlayers.length;

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`voting_${roomCode}`)
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "players", filter: `room_code=eq.${roomCode}` },
        (payload: { new: Player }) => {
          setPlayers((prev) => 
            prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
          );
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${roomCode}` },
        (payload: { new: { status: string } }) => {
          if (payload.new.status === "GAME_OVER") {
            router.push(`/game/${roomCode}/results`);
          } else if (payload.new.status === "playing") {
            // New round started
            router.push(`/game/${roomCode}/play`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, supabase, router]);

  const handleConfirmVote = () => {
    if (!selectedCandidate || hasVoted) return;

    startTransition(async () => {
      const result = await submitVoteAction(roomCode, myPlayerId, selectedCandidate);
      if (!result.success) {
        alert(result.error || "Error al votar");
      }
    });
  };

  if (amIEliminated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
        <Skull className="w-24 h-24 text-red-500 animate-pulse" />
        <h2 className="text-3xl font-black text-red-500">ESTÁS ELIMINADO</h2>
        <p className="text-gray-400">No puedes votar, pero puedes observar.</p>
        <div className="text-xl font-bold text-white">
          Votos: {votesCast} / {totalAlive}
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-in zoom-in">
        <CheckCircle2 className="w-24 h-24 text-green-500" />
        <h2 className="text-3xl font-black text-green-500">VOTO REGISTRADO</h2>
        <p className="text-gray-400">Esperando a los demás jugadores...</p>
        <div className="text-xl font-bold text-white">
          Votos: {votesCast} / {totalAlive}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white">¿QUIÉN ES EL IMPOSTOR?</h2>
        <p className="text-gray-400">Selecciona un jugador y confirma tu voto.</p>
        <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold text-white">
          Votos: {votesCast} / {totalAlive}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {alivePlayers.map((player) => (
          player.id !== myPlayerId && (
            <button
              key={player.id}
              onClick={() => setSelectedCandidate(player.id)}
              disabled={isPending}
              className={`relative group flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
                selectedCandidate === player.id
                  ? "bg-red-500/20 border-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                  <User className="h-8 w-8 text-white" />
                </div>
                {/* Show check if this player has already voted (but not who they voted for) */}
                {player.voted_for_id && (
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg animate-in zoom-in">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <span className="font-bold text-white text-lg">{player.name}</span>
            </button>
          )
        ))}
      </div>

      {/* Floating Confirm Button */}
      {selectedCandidate && (
        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center animate-in slide-in-from-bottom-4">
          <button
            onClick={handleConfirmVote}
            disabled={isPending}
            className="w-full max-w-md py-4 rounded-2xl bg-red-600 text-white font-black text-xl shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isPending ? "ENVIANDO..." : "CONFIRMAR VOTO"}
          </button>
        </div>
      )}
    </div>
  );
}
