'use client';

import React, { useCallback, useRef } from 'react';
import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Copy, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface QueryResult {
  success: boolean;
  rowCount: number | null;
  rows: Record<string, any>[];
  fields: Array<{ name: string; dataTypeID: number }>;
  error?: string;
}

export function QueryTool() {
  const [query, setQuery] = useState('SELECT * FROM information_schema.tables LIMIT 5;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const editorViewRef = useRef<EditorView | null>(null);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Query execution failed');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Comment/uncomment functionality
  const toggleComment = useCallback(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const { state } = view;
    const selection = state.selection.main;
    const doc = state.doc;
    
    // Get selected lines
    const fromLine = doc.lineAt(selection.from);
    const toLine = doc.lineAt(selection.to);
    
    let allCommented = true;
    
    // Check if all selected lines are commented
    for (let i = fromLine.number; i <= toLine.number; i++) {
      const line = doc.line(i);
      const text = line.text.trim();
      if (text && !text.startsWith('--')) {
        allCommented = false;
        break;
      }
    }
    
    // Toggle comments
    const changes: { from: number; to: number; insert: string }[] = [];
    for (let i = fromLine.number; i <= toLine.number; i++) {
      const line = doc.line(i);
      if (allCommented) {
        // Uncomment
        if (line.text.trim().startsWith('--')) {
          const indent = line.text.match(/^\s*/)?.[0] || '';
          const uncommented = line.text.replace(/^\s*--\s?/, '');
          changes.push({
            from: line.from,
            to: line.to,
            insert: uncommented,
          });
        }
      } else {
        // Comment (only if line is not empty)
        if (line.text.trim()) {
          const indent = line.text.match(/^\s*/)?.[0] || '';
          const content = line.text.trim();
          changes.push({
            from: line.from,
            to: line.to,
            insert: `${indent}-- ${content}`,
          });
        }
      }
    }
    
    // Apply changes in reverse order to maintain positions
    if (changes.length > 0) {
      view.dispatch({
        changes: changes.reverse(),
        selection: { anchor: selection.from, head: selection.to },
      });
    }
  }, []);

  const onChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  // Custom keymap for comment/uncomment (Ctrl+/ or Cmd+/)
  const customKeymapBindings = [
    {
      key: 'Mod-/',
      run: () => {
        toggleComment();
        return true;
      },
    },
    {
      key: 'Mod-Enter',
      run: () => {
        executeQuery();
        return true;
      },
    },
  ];

  const extensions = [
    sql(),
    history(),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': {
        fontSize: '14px',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '200px',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        borderRadius: '6px',
        backgroundColor: '#1e1e1e',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
        backgroundColor: '#1e1e1e',
      },
      '.cm-gutters': {
        backgroundColor: '#252526',
        color: '#858585',
        border: 'none',
      },
      '.cm-lineNumbers': {
        color: '#858585',
      },
      '.cm-line': {
        color: '#d4d4d4',
      },
      '.cm-cursor': {
        borderLeftColor: '#aeafad',
      },
      '.cm-selectionBackground': {
        backgroundColor: '#264f78',
      },
    }),
    keymap.of([...defaultKeymap, ...historyKeymap, ...customKeymapBindings]),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SQL Query Editor</CardTitle>
              <CardDescription className="mt-1">
                Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Ctrl+Enter</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Cmd+Enter</kbd> to execute. <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Ctrl+/</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Cmd+/</kbd> to comment/uncomment.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyQuery}
                disabled={!query.trim()}
                title="Copy query"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearQuery}
                disabled={!query.trim()}
                title="Clear query"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="border rounded-md overflow-hidden bg-[#1e1e1e]">
            <CodeMirror
              value={query}
              height="300px"
              extensions={extensions}
              onChange={onChange}
              theme={oneDark}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: true,
              }}
              onUpdate={(view) => {
                editorViewRef.current = view.view;
              }}
            />
          </div>
          <Button
            onClick={executeQuery}
            disabled={loading || !query.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Execute Query
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">SQL Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-mono text-sm text-destructive whitespace-pre-wrap">{error}</p>
              {error.toLowerCase().includes('limit') && (
                <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive/90 font-semibold mb-1">💡 Tip:</p>
                  <p className="text-sm text-destructive/80">
                    The <code className="bg-destructive/10 px-1 py-0.5 rounded">LIMIT</code> clause requires a number.
                    <br />
                    Example: <code className="bg-destructive/10 px-1 py-0.5 rounded">LIMIT 10</code> or <code className="bg-destructive/10 px-1 py-0.5 rounded">LIMIT 100</code>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Returned {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      {result.fields.map((field) => (
                        <th
                          key={field.name}
                          className="px-4 py-2 text-left font-semibold text-foreground"
                        >
                          {field.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-border hover:bg-muted/50">
                        {result.fields.map((field) => (
                          <td key={`${rowIdx}-${field.name}`} className="px-4 py-2 text-foreground">
                            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                              {formatValue(row[field.name])}
                            </code>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No rows returned</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null) {
    return 'NULL';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
