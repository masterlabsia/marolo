import Header from "@/components/Layout/Header";
import SidebarNav from "@/components/Layout/SidebarNav";
import BottomNav from "@/components/Layout/BottomNav";

const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Desktop sidebar (hidden on mobile) */}
      <SidebarNav />

      {/* Mobile-only top header */}
      <Header />

      {/* Main content — offset by sidebar width on desktop */}
      <main className="relative z-10 px-4 md:px-8 py-7 md:py-8 pb-24 md:pb-8 md:ml-56">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
};

export default AppShell;
