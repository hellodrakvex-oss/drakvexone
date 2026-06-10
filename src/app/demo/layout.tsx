import { BottomNav } from "@/components/bottom-nav";
import { DemoProviders } from "./providers";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProviders>
      <div className="flex flex-col min-h-screen premium-canvas noise-texture pb-16">
        <main className="relative z-[2] flex-1 flex flex-col">{children}</main>
        <BottomNav basePath="/demo" />
      </div>
    </DemoProviders>
  );
}
