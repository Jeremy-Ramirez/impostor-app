"use client";

import { useEffect, useState, useActionState } from "react";
import { createClient } from "@/utils/supabase/client";
import { startGameAction } from "@/actions/start-game";
import { Loader2, User, Crown, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerPlayerAction } from "@/actions/register-player";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  is_impostor: boolean;
}

interface GameClientProps {
  roomCode: string;
  initialPlayers: Player[];
  initialRoomStatus: string;
  secretWord?: string; // Optional now
  category?: string;   // Optional now
}

export default function GameClient({
  roomCode,
  initialPlayers,
  initialRoomStatus,
}: GameClientProps) {
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [roomStatus, setRoomStatus] = useState(initialRoomStatus);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();
  
  // Start Game Action
  const [startState, startAction, isStarting] = useActionState(
    async () => startGameAction(roomCode),
    null
  );

  // Check for existing session/player
  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`impostor_player_${roomCode}`);
    if (storedPlayerId) {
      setMyPlayerId(storedPlayerId);
      const player = players.find((p) => p.id === storedPlayerId);
      if (player) {
        setIsRegistered(true);
      }
    }
  }, [roomCode, players]);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`room_${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_code=eq.${roomCode}` },
        (payload: { eventType: string; new: Player }) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${roomCode}` },
        (payload: { new: { status: string } }) => {
          if (payload.new.status) {
            setRoomStatus(payload.new.status);
            if (payload.new.status === "playing") {
              router.push(`/game/${roomCode}/play`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, supabase, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const result = await registerPlayerAction(roomCode, playerName);

    if (result.error || !result.player) {
      console.error("Error joining:", result.error);
      alert(result.error || "Error al unirse.");
      return;
    }

    if (result.player) {
      // Save to localStorage for client UI state persistence
      localStorage.setItem(`impostor_player_${roomCode}`, result.player.id);
      setMyPlayerId(result.player.id);
      setIsRegistered(true);
    }
  };

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.is_host;

  // --- RENDER: REGISTRATION ---
  if (!isRegistered) {
    return (
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">¡Únete a la partida!</h2>
          <p className="text-gray-400">Elige un nombre para jugar.</p>
        </div>
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Tu Nickname"
            className="w-full rounded-xl border-2 border-white/10 bg-white/5 p-4 text-center text-xl text-white placeholder:text-white/20 focus:border-impostor-primary focus:outline-none transition-all"
            maxLength={12}
            autoFocus
          />
          <button
            type="submit"
            disabled={!playerName.trim()}
            className="w-full rounded-xl bg-impostor-primary py-4 font-bold text-white shadow-lg hover:bg-impostor-primary-hover disabled:opacity-50 transition-all"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // --- RENDER: LOBBY ---
  // If status is playing, we redirect (handled by useEffect), but we can show a loading state or the lobby until redirect happens.
  return (
    <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-4">
        <div className="inline-block rounded-full bg-white/5 px-6 py-2 border border-white/10">
          <span className="text-gray-400 uppercase text-xs tracking-widest">Código de Sala</span>
          <p className="text-4xl font-black text-white tracking-[0.2em] mt-1">{roomCode}</p>
        </div>
        <p className="text-gray-400">
          Esperando jugadores... ({players.length})
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {players.map((player) => (
          <div
            key={player.id}
            className={`relative flex items-center gap-3 rounded-xl border p-4 transition-all ${
              player.id === myPlayerId
                ? "bg-impostor-primary/10 border-impostor-primary"
                : "bg-white/5 border-white/5"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="font-medium text-white truncate">{player.name}</span>
            {player.is_host && (
              <Crown className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 fill-yellow-400/20 rotate-12" />
            )}
          </div>
        ))}
      </div>

      {isHost && (
        <div className="flex justify-center pt-8">
          <form action={startAction}>
            <button
              type="submit"
              disabled={players.length < 3 || isStarting}
              className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-impostor-secondary to-purple-600 px-10 py-5 text-xl font-black text-white shadow-xl transition-all hover:scale-105 hover:shadow-impostor-secondary/50 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isStarting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Play className="h-6 w-6 fill-current" />
              )}
              COMENZAR PARTIDA
              {players.length < 3 && (
                <span className="absolute -bottom-8 left-0 w-full text-center text-xs font-normal text-red-400">
                  Mínimo 3 jugadores
                </span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
