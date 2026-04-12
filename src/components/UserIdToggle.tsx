"use client";

import { useState } from "react";

interface UserIdToggleProps {
  userId: string | null;
}

export default function UserIdToggle({ userId }: UserIdToggleProps) {
  const [visible, setVisible] = useState(false);

  if (!userId) {
    return <span className="font-mono text-xs text-warm-gray-light">--</span>;
  }

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="font-mono text-xs text-warm-gray-light hover:text-foreground transition-colors"
      >
        {userId.slice(0, 8)}... (show)
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setVisible(false)}
      className="font-mono text-xs text-warm-gray-light hover:text-foreground transition-colors"
    >
      {userId}
    </button>
  );
}
