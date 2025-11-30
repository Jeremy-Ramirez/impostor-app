import HomeButtons from "@/components/HomeButtons";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl animate-in fade-in zoom-in duration-1000">
        
        {/* Title Section */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-impostor-primary via-white to-impostor-accent drop-shadow-[0_0_15px_rgba(233,69,96,0.5)]">
            IMPOSTOR
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 font-medium tracking-wide">
            Confía en nadie. Sospecha de todos.
          </p>
        </div>

        {/* Decorative Element (Optional - kept simple for now) */}
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-impostor-accent to-transparent opacity-50 rounded-full" />

        {/* CTAs */}
        <HomeButtons />
        
      </div>

      {/* Background Elements for atmosphere */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-impostor-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-impostor-primary/10 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
