import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";

const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      <main className="relative z-10 px-4 md:px-6 py-6 max-w-7xl mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
