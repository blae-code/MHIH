/**
 * CommentAnchor — small button placed next to charts / workbench sessions.
 * Opens the team comments side-panel focused on that specific item.
 */

import React from "react";
import { MessageSquarePlus } from "lucide-react";

export function openComments(targetKey, targetLabel) {
  window.dispatchEvent(new CustomEvent("rr-open-comments", {
    detail: { target_key: targetKey, target_label: targetLabel },
  }));
}

export default function CommentAnchor({ targetKey, targetLabel }) {
  return (
    <button
      type="button"
      onClick={() => openComments(targetKey, targetLabel)}
      title={`Comment on: ${targetLabel}`}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all shrink-0"
      style={{
        background: "rgba(254,221,0,0.06)",
        border: "1px solid rgba(254,221,0,0.25)",
        color: "var(--mnbc-yellow)",
        fontSize: 10, fontWeight: 600,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(254,221,0,0.14)";
        e.currentTarget.style.borderColor = "rgba(254,221,0,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(254,221,0,0.06)";
        e.currentTarget.style.borderColor = "rgba(254,221,0,0.25)";
      }}
    >
      <MessageSquarePlus size={11} />
      Comment
    </button>
  );
}