export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-background p-8">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
