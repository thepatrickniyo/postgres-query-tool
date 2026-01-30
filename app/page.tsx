import { QueryTool } from '@/components/query-tool';

export const metadata = {
  title: 'SQL Query Tool',
  description: 'Execute SQL queries against your PostgreSQL database',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            SQL Query Tool
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Execute and visualize your PostgreSQL queries
          </p>
        </div>
        <QueryTool />
      </div>
    </main>
  );
}
