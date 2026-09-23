import React, { useMemo } from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  bulkActions?: React.ReactNode;
  ariaLabelExtractor?: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Buscar...',
  searchValue,
  onSearchChange,
  emptyMessage = 'No hay datos disponibles.',
  isLoading = false,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  bulkActions,
  ariaLabelExtractor
}: DataTableProps<T>) {
  
  const allKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);
  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allKeys);
    }
  };

  const toggleOne = (key: string) => {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter(k => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  };

  return (
    <div className="bg-surface border border-glass-border rounded-2xl overflow-hidden shadow-sm flex flex-col relative w-full max-w-full">
      {/* Header & Search */}
      {onSearchChange && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-glass-border">
          <div className="flex items-center gap-2 bg-background border border-glass-border rounded-xl px-3 py-2 text-text-muted focus-within:border-accent/50 focus-within:text-foreground transition-colors w-full sm:w-auto sm:min-w-[280px]">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-text-muted/50"
            />
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectable && selectedKeys.length > 0 && bulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 right-4 z-20 flex items-center gap-4 bg-accent/10 border border-accent/20 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg"
          >
            <span className="text-sm font-bold text-accent">
              {selectedKeys.length} seleccionado(s)
            </span>
            <div className="flex items-center gap-2 border-l border-accent/20 pl-4">
              {bulkActions}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Wrapper */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background border-b border-glass-border">
              {selectable && (
                <th className="py-4 px-6 sticky top-0 bg-background z-10 w-12">
                  <button 
                    onClick={toggleAll} 
                    role="checkbox"
                    aria-checked={isAllSelected}
                    aria-label="Seleccionar todas las filas"
                    className="text-text-muted hover:text-foreground transition-colors"
                  >
                    {isAllSelected ? <CheckSquare size={18} className="text-accent" /> : <Square size={18} />}
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.header || col.accessor)}
                  className={`py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-widest sticky top-0 bg-background z-10 whitespace-nowrap ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-live="polite" className="divide-y divide-glass-border">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-12 text-center text-text-muted">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span>Cargando datos...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-12 text-center text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, i) => {
                const key = keyExtractor(item);
                const isSelected = selectedKeys.includes(key);
                return (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                    key={key}
                    className={`transition-colors ${isSelected ? 'bg-accent/5' : 'hover:bg-background/50'}`}
                  >
                    {selectable && (
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => toggleOne(key)} 
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={ariaLabelExtractor ? ariaLabelExtractor(item) : 'Seleccionar fila'}
                          className="text-text-muted hover:text-foreground transition-colors"
                        >
                          {isSelected ? <CheckSquare size={18} className="text-accent" /> : <Square size={18} />}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.header || col.accessor)} className={`py-4 px-6 whitespace-nowrap ${col.className || ''}`}>
                        {typeof col.accessor === 'function'
                          ? col.accessor(item)
                          : (item[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
