interface DiffViewerProps {
  original: string;
  modified: string;
}

export function DiffViewer({ original, modified }: DiffViewerProps) {
  return (
    <div className="bg-zinc-950 text-gray-300 p-4 rounded-md font-mono text-sm overflow-x-auto">
      <div className="flex flex-col gap-1">
        <div className="text-red-400">- {original}</div>
        <div className="text-green-400">+ {modified}</div>
      </div>
    </div>
  );
}
