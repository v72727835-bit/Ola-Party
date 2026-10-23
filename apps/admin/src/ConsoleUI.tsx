import { LogOut, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReactElement } from 'react';

export function ProfileMenu({ logout }: { logout: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Administrator account menu" className="console-profile"><span className="online-dot"/><span className="profile-label">Administrator</span><Avatar><AvatarFallback>AD</AvatarFallback></Avatar></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Administrator access</DropdownMenuLabel><DropdownMenuItem onClick={logout}><LogOut size={16}/> Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
export function NavHint({ label, children }: { label: string; children: ReactElement }) {
  return <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip>;
}
export function LoadingRecords() {
  return <div role="status" aria-label="Loading community records" className="console-skeleton"><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="space-y-3"><Skeleton className="h-3 w-20"/><Skeleton className="h-9 w-16"/><Skeleton className="h-3 w-24"/></div>)}</div></div>;
}
export function AccessDialog({ user, busy, close, confirm }: { user: { name: string; disabled?: boolean } | null; busy: boolean; close: () => void; confirm: () => void }) {
  return <Dialog open={!!user} onOpenChange={open => { if (!open && !busy) close(); }}><DialogContent><DialogHeader><ShieldCheck size={26}/><DialogTitle>{user?.disabled ? 'Restore' : 'Disable'} member access?</DialogTitle><DialogDescription>{user?.disabled ? `${user.name} will be able to sign in again.` : `${user?.name} will be signed out and removed from active rooms. Their account records will remain available.`}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={busy} onClick={close}>Cancel</Button><Button disabled={busy} onClick={confirm}>{busy ? 'Saving…' : user?.disabled ? 'Restore access' : 'Disable access'}</Button></DialogFooter></DialogContent></Dialog>;
}
