'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Database, Table, Loader2, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  columns: TableColumn[];
}

interface DatabaseSidebarProps {
  onTableClick?: (schema: string, table: string) => void;
  onColumnClick?: (schema: string, table: string, column: string) => void;
}

export function DatabaseSidebar({ onTableClick, onColumnClick }: DatabaseSidebarProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/schema');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch schema');
      } else {
        setTables(data.tables || []);
        // Auto-expand first schema
        if (data.tables && data.tables.length > 0) {
          const firstSchema = data.tables[0].table_schema;
          setExpandedSchemas(new Set([firstSchema]));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchema = (schema: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schema)) {
      newExpanded.delete(schema);
    } else {
      newExpanded.add(schema);
    }
    setExpandedSchemas(newExpanded);
  };

  const toggleTable = (schema: string, table: string) => {
    const key = `${schema}.${table}`;
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTables(newExpanded);
  };

  const handleTableClick = (schema: string, table: string) => {
    if (onTableClick) {
      onTableClick(schema, table);
    }
  };

  const handleColumnClick = (schema: string, table: string, column: string) => {
    if (onColumnClick) {
      onColumnClick(schema, table, column);
    }
  };

  // Filter tables based on search query
  const filteredTables = tables.filter((table) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      table.table_schema.toLowerCase().includes(query) ||
      table.table_name.toLowerCase().includes(query) ||
      table.columns.some((col) => col.column_name.toLowerCase().includes(query))
    );
  });

  // Group tables by schema
  const schemaGroups = filteredTables.reduce((acc, table) => {
    if (!acc[table.table_schema]) {
      acc[table.table_schema] = [];
    }
    acc[table.table_schema].push(table);
    return acc;
  }, {} as Record<string, TableInfo[]>);

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database
          </h2>
          <button
            onClick={fetchSchema}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            ↻
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive">{error}</div>
        ) : (
          <div className="p-2">
            {Object.entries(schemaGroups).map(([schema, schemaTables]) => (
              <div key={schema} className="mb-2">
                <button
                  onClick={() => toggleSchema(schema)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {expandedSchemas.has(schema) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="text-xs font-mono">{schema}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    ({schemaTables.length})
                  </span>
                </button>

                {expandedSchemas.has(schema) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {schemaTables.map((table) => {
                      const tableKey = `${schema}.${table.table_name}`;
                      const isExpanded = expandedTables.has(tableKey);
                      return (
                        <div key={tableKey} className="mb-1">
                          <button
                            onClick={() => toggleTable(schema, table.table_name)}
                            onDoubleClick={() => handleTableClick(schema, table.table_name)}
                            className="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted rounded-md transition-colors group"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                            <Table className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                            <span className="font-mono text-foreground flex-1 text-left">
                              {table.table_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({table.columns.length})
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="ml-6 mt-1 space-y-0.5">
                              {table.columns.map((column) => (
                                <button
                                  key={column.column_name}
                                  onClick={() =>
                                    handleColumnClick(schema, table.table_name, column.column_name)
                                  }
                                  className="w-full flex items-center gap-2 px-2 py-0.5 text-xs hover:bg-muted/50 rounded transition-colors group"
                                  title={`${column.data_type}${column.is_nullable === 'NO' ? ' NOT NULL' : ''}`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-500" />
                                  <span className="font-mono text-muted-foreground group-hover:text-foreground flex-1 text-left">
                                    {column.column_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground/70">
                                    {column.data_type}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {Object.keys(schemaGroups).length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No tables found
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
