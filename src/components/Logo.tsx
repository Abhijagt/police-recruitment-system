import { Badge } from 'lucide-react';

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-2 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
        <Badge className="h-5 w-5 text-primary-foreground" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">PRMS</span>
          <span className="text-xs font-medium text-sidebar-primary">RUNNING</span>
        </div>
      )}
    </div>
  );
}
