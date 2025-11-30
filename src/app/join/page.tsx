import JoinRoomForm from "@/components/JoinRoomForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function JoinRoomPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-black tracking-tight text-white">
              Unirse a Sala
            </h1>
            <p className="text-gray-400">
              Introduce el código que te dio el anfitrión.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl">
            <JoinRoomForm />
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-impostor-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-impostor-secondary/10 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
