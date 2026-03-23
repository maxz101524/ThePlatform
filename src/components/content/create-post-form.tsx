"use client";

import { useState } from "react";
import { createPost } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  lifterId?: string;
  meetId?: string;
}

export function CreatePostForm({ lifterId, meetId }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <Card
        className="cursor-pointer text-text-muted hover:border-accent-primary transition-colors"
        onClick={() => setExpanded(true)}
      >
        What&apos;s on your mind?
      </Card>
    );
  }

  return (
    <Card>
      <form action={createPost} className="space-y-3">
        <textarea
          name="body_text"
          placeholder="Share a take, link a video, start a discussion..."
          className="w-full resize-none rounded-md border border-border bg-bg-primary p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          rows={3}
          maxLength={2000}
          required
        />
        <input
          name="link_url"
          type="url"
          placeholder="Paste a link (optional)"
          className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
        />
        {lifterId && <input type="hidden" name="lifter_id" value={lifterId} />}
        {meetId && <input type="hidden" name="meet_id" value={meetId} />}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={() => setExpanded(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
