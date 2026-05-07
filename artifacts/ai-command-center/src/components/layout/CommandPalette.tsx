import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUIStore } from "@/stores/uiStore";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { LayoutDashboard, MessageSquare, Settings, Bot, Search } from "lucide-react";
import { mockAgents } from "@/api/agents";

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, openCommandPalette } = useUIStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (commandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, closeCommandPalette, openCommandPalette]);

  const runCommand = (command: () => void) => {
    closeCommandPalette();
    command();
  };

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={(open) => !open && closeCommandPalette()}>
      <DialogContent className="p-0 overflow-hidden shadow-2xl rounded-xl border-border bg-popover max-w-xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Type a command or search..." data-testid="command-palette-input" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem onSelect={() => runCommand(() => setLocation("/"))} data-testid="cmd-page-dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setLocation("/agents"))} data-testid="cmd-page-agents">
                <Bot className="mr-2 h-4 w-4" />
                <span>Agents</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setLocation("/chat"))} data-testid="cmd-page-chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Chat</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setLocation("/settings"))} data-testid="cmd-page-settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Agents">
              {mockAgents.map((agent) => (
                <CommandItem key={agent.id} onSelect={() => runCommand(() => setLocation("/agents"))} data-testid={`cmd-agent-${agent.id}`}>
                  <Bot className="mr-2 h-4 w-4" />
                  <span>{agent.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{agent.model}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
