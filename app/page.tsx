'use client';

import { QueryTool } from '@/components/query-tool';
import { DatabaseSidebar } from '@/components/database-sidebar';
import { useState, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const insertTextRef = useRef<((text: string) => void) | null>(null);

  const handleTableClick = (schema: string, table: string) => {
    const fullName = schema !== 'public' ? `${schema}.${table}` : table;
    if (insertTextRef.current) {
      insertTextRef.current(fullName);
    }
  };

  const handleColumnClick = (schema: string, table: string, column: string) => {
    const tableName = schema !== 'public' ? `${schema}.${table}` : table;
    const fullColumn = `${tableName}.${column}`;
    if (insertTextRef.current) {
      insertTextRef.current(fullColumn);
    }
  };

  return (
    <main className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="border-b px-4 py-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          SQL Query Tool
        </h1>
        <p className="text-sm text-muted-foreground">
          Execute and visualize your PostgreSQL queries
        </p>
      </div>
      
      <PanelGroup direction="horizontal" className="flex-1">
        {!sidebarCollapsed && (
          <>
            <Panel defaultSize={20} minSize={15} maxSize={35} className="min-w-[200px]">
              <div className="h-full">
                <DatabaseSidebar
                  onTableClick={handleTableClick}
                  onColumnClick={handleColumnClick}
                />
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 bg-border hover:bg-border/80 transition-colors relative group">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-border group-hover:bg-primary/50 transition-colors" />
            </PanelResizeHandle>
          </>
        )}
        <Panel defaultSize={sidebarCollapsed ? 100 : 80}>
          <div className="h-full overflow-auto p-6">
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="mb-2"
              >
                {sidebarCollapsed ? (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Show Sidebar
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Hide Sidebar
                  </>
                )}
              </Button>
            </div>
            <QueryTool insertTextRef={insertTextRef} />
          </div>
        </Panel>
      </PanelGroup>
    </main>
  );
}
