'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';
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

const AVAILABLE_EVENTS = [
  { id: 'invoice.created', label: 'Invoice Created' },
  { id: 'invoice.paid', label: 'Invoice Paid' },
  { id: 'usage.threshold', label: 'Usage Threshold Exceeded' },
  { id: 'customer.created', label: 'Customer Created' },
  { id: 'api_key.created', label: 'API Key Created' },
];

export function AddWebhookDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'invoice.created',
  ]);
  const [creating, setCreating] = useState(false);

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!url.trim() || selectedEvents.length === 0) return;

    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), events: selectedEvents }),
      });

      if (res.ok) {
        setOpen(false);
        setUrl('');
        setSelectedEvents(['invoice.created']);
        router.refresh();
      }
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Add Webhook</DialogTitle>
          <DialogDescription>
            We&apos;ll send POST requests to this URL when events occur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              id="webhook-url"
              placeholder="https://your-app.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Events to subscribe</Label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event.id);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => toggleEvent(event.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{event.id}</code>
                      <span className="text-muted-foreground text-xs">
                        {event.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !url.trim() || selectedEvents.length === 0}
          >
            {creating ? 'Creating...' : 'Add Webhook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}