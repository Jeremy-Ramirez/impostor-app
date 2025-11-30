"use client";

import { useState } from "react";
import { Eye, EyeOff, HelpCircle } from "lucide-react";

interface RoleCardProps {
  isImpostor: boolean;
  secretWord: string | null;
  category: string;
}

export default function RoleCard({ isImpostor, secretWord, category }: RoleCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div
      onClick={() => setIsRevealed(!isRevealed)}
      className="relative w-full aspect-[3/4] cursor-pointer perspective-1000 group"
    >
      <div
        className={`relative w-full h-full transition-all duration-700 transform-style-3d ${
          isRevealed ? "rotate-y-180" : ""
        }`}
      >
        {/* FRONT (Hidden) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border-4 border-white/20 bg-gradient-to-br from-gray-900 to-black shadow-2xl flex flex-col items-center justify-center p-8">
          <HelpCircle className="h-24 w-24 text-white/20 mb-4 animate-pulse" />
          <h2 className="text-2xl font-black text-white text-center uppercase tracking-widest">
            Toca para revelar<br />tu rol
          </h2>
          <p className="mt-4 text-sm text-gray-500">Mantén tu identidad en secreto</p>
        </div>

        {/* BACK (Revealed) */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border-4 shadow-2xl flex flex-col items-center justify-center p-8 text-center ${
            isImpostor
              ? "border-red-500 bg-gradient-to-b from-red-900 to-black"
              : "border-impostor-secondary bg-gradient-to-b from-impostor-secondary/30 to-black"
          }`}
        >
          <div className="mb-6">
            {isImpostor ? (
              <EyeOff className="h-20 w-20 text-red-500 animate-bounce" />
            ) : (
              <Eye className="h-20 w-20 text-impostor-secondary animate-pulse" />
            )}
          </div>

          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">
            {isImpostor ? "ERES EL IMPOSTOR" : "ERES UN ALDEANO"}
          </h2>

          <p className={`text-sm font-medium mb-8 ${isImpostor ? "text-red-300" : "text-blue-200"}`}>
            {isImpostor
              ? "Engaña a todos. No dejes que descubran quién eres."
              : "Descubre al impostor. La palabra secreta es tu clave."}
          </p>

          <div className="w-full rounded-xl bg-black/40 p-4 backdrop-blur-sm border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Categoría</p>
            <p className="text-xl font-bold text-white mb-4">{category}</p>

            <div className="h-px w-full bg-white/10 mb-4" />

            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Palabra Secreta</p>
            {isImpostor ? (
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
                ???
              </p>
            ) : (
              <p className="text-3xl font-black text-impostor-secondary">
                {secretWord}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
