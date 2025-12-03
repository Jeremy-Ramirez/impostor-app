import { User, Crown, Mic } from "lucide-react";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
}

interface PlayerListHorizontalProps {
  players: Player[];
  myPlayerId?: string;
  activePlayerId?: string;
}

export default function PlayerListHorizontal({ players, myPlayerId, activePlayerId }: PlayerListHorizontalProps) {
  return (
    <div className="w-full overflow-x-auto pb-8 pt-4">
      <div className="flex gap-6 px-8 min-w-max mx-auto justify-center">
        {players.map((player) => {
          const isActive = player.id === activePlayerId;
          const isMe = player.id === myPlayerId;
          
          return (
            <div
              key={player.id}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-500 ${
                isActive
                  ? "bg-impostor-primary/20 border-impostor-primary scale-110 shadow-[0_0_30px_rgba(var(--impostor-primary-rgb),0.5)] z-10"
                  : "bg-white/5 border-white/10 opacity-70 scale-100"
              }`}
            >
              <div className="relative">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                  isActive ? "bg-impostor-primary text-white shadow-lg" : "bg-white/10 text-white"
                }`}>
                  <User className="h-7 w-7" />
                </div>
                
                {player.is_host && (
                  <Crown className="absolute -top-3 -right-3 h-6 w-6 text-yellow-400 fill-yellow-400/20 rotate-12 drop-shadow-md" />
                )}
                
                {isActive && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 animate-bounce shadow-lg">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <span className={`text-sm font-bold max-w-[100px] truncate text-center transition-colors ${
                isActive ? "text-impostor-primary" : "text-white"
              }`}>
                {player.name}
              </span>
              
              {isMe && (
                <span className="absolute -bottom-3 text-[10px] font-bold text-white bg-impostor-secondary px-2 py-0.5 rounded-full shadow-sm">
                  TÚ
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
