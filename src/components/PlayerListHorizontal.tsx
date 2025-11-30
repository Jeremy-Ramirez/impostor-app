import { User, Crown } from "lucide-react";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
}

interface PlayerListHorizontalProps {
  players: Player[];
  currentPlayerId?: string;
}

export default function PlayerListHorizontal({ players, currentPlayerId }: PlayerListHorizontalProps) {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 px-4 min-w-max mx-auto justify-center">
        {players.map((player) => (
          <div
            key={player.id}
            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
              player.id === currentPlayerId
                ? "bg-impostor-primary/20 border-impostor-primary scale-105"
                : "bg-white/5 border-white/10 opacity-70"
            }`}
          >
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <User className="h-6 w-6 text-white" />
              </div>
              {player.is_host && (
                <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 fill-yellow-400/20 rotate-12" />
              )}
            </div>
            <span className="text-xs font-bold text-white max-w-[80px] truncate text-center">
              {player.name}
            </span>
            {player.id === currentPlayerId && (
              <span className="absolute -bottom-2 text-[10px] font-bold text-impostor-primary bg-black/50 px-2 rounded-full">
                TÚ
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
