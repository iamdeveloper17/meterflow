'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface CreateKeyDialogProps {
    onCreated?: () => void;
}

export function CreateKeyDialog({ onCreated }: CreateKeyDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() }),
            });

            const data = await res.json();
            if (res.ok) {
                setCreatedKey(data.key);
                setName('');
                onCreated?.();
                // Delay refresh so server has time to process
                setTimeout(() => router.refresh(), 100);
            }
        } catch (err) {
            console.error('Create failed:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = () => {
        if (!createdKey) return;
        navigator.clipboard.writeText(createdKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setOpen(false);
        setCreatedKey(null);
        setCopied(false);
        setName('');
        router.refresh();  // ← ye line hai?
    };

    return (
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
            <DialogTrigger
                render={
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Key
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-lg w-full overflow-hidden">
                {!createdKey ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create API Key</DialogTitle>
                            <DialogDescription>
                                Give your key a name so you can identify it later.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2 py-4">
                            <Label htmlFor="key-name">Key name</Label>
                            <Input
                                id="key-name"
                                placeholder="e.g., Production, Development"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                autoFocus
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose} disabled={creating}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                                {creating ? 'Creating...' : 'Create Key'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>API Key Created</DialogTitle>
                            <DialogDescription>
                                Copy this key now — you won&apos;t see it again.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-4 min-w-0">
                            <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>
                                    For security, this is the only time you&apos;ll see this key.
                                    Store it safely.
                                </p>
                            </div>

                            <div className="flex items-start gap-2 min-w-0">
                                <code className="flex-1 min-w-0 break-all rounded-md border border-border bg-muted px-3 py-2 text-xs font-mono">
                                    {createdKey}
                                </code>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handleCopy}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}