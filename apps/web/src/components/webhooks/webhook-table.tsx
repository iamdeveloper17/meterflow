'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Webhook, MoreHorizontal, Trash2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export function WebhookTable({ webhooks: initial }: { webhooks: WebhookItem[] }) {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState(initial);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/webhooks/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== deleteId));
        setDeleteId(null);
        router.refresh();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (webhooks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Webhook className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium">No webhooks yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first endpoint to receive event notifications.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((webhook) => (
              <TableRow key={webhook.id}>
                <TableCell className="font-medium max-w-md truncate">
                  <code className="text-xs">{webhook.url}</code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.slice(0, 3).map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                    {webhook.events.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{webhook.events.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {webhook.isActive ? (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(webhook.createdAt).toISOString().split('T')[0]}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setDeleteId(webhook.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Webhook
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Webhook?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Events will no longer be sent to
              this URL.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}