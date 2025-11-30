import Link from "next/link";
import { Plus, Users } from "lucide-react";

export default function HomeButtons() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs sm:flex-row sm:max-w-md sm:justify-center">
      <Link
        href="/create"
        className="group flex items-center justify-center gap-3 rounded-xl bg-impostor-primary px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-impostor-primary-hover hover:scale-105 hover:shadow-impostor-primary/50 focus:outline-none focus:ring-4 focus:ring-impostor-primary/30"
      >
        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
        Crear Sala
      </Link>
      
      <Link
        href="/join"
        className="group flex items-center justify-center gap-3 rounded-xl border-2 border-impostor-secondary bg-transparent px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-impostor-secondary hover:border-impostor-secondary-hover hover:scale-105 focus:outline-none focus:ring-4 focus:ring-impostor-secondary/30"
      >
        <Users className="w-6 h-6 transition-transform group-hover:scale-110" />
        Unirte a Sala
      </Link>
    </div>
  );
}
