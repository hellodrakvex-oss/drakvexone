import { BottomNav } from "@/components/bottom-nav";
import { DashboardProviders } from "./providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProviders>
      <div className="flex flex-col min-h-screen premium-canvas noise-texture pb-16">
        <main className="relative z-[2] flex-1 flex flex-col">{children}</main>
        <BottomNav />
      </div>
    </DashboardProviders>
  );
}
