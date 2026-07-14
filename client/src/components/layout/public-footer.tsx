export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text font-semibold text-transparent">
          ExpenseFlow
        </p>
        <p>Built with Next.js, Express, Prisma, Redux Toolkit, and React Query.</p>
      </div>
    </footer>
  );
}
