import { useState } from "react";

function formatMessageDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessageInbox({
  messages,
  title = "Messages",
  emptyText = "No messages yet.",
  onCompose,
  composeLabel = "New message",
}) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="card message-inbox" aria-labelledby="message-inbox-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-ink-fog">
            Inbox
          </p>
          <h2 id="message-inbox-title" className="mt-1 font-display text-lg font-semibold text-ink">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-indigo-soft text-indigo-deep">{messages.length}</span>
          {onCompose && (
            <button type="button" onClick={onCompose} className="btn-brand px-3 py-2 text-xs">
              {composeLabel}
            </button>
          )}
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="mt-5 rounded-xl bg-porcelain-dim px-4 py-5 font-body text-sm text-ink-fog">
          {emptyText}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {messages.map((message) => {
            const isOpen = openId === message.id;
            return (
              <li key={message.id} className={`message-row ${isOpen ? "message-row-open" : ""}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left"
                  onClick={() => setOpenId(isOpen ? null : message.id)}
                  aria-expanded={isOpen}
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-coral"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className="font-body text-sm font-semibold text-ink">
                        {message.title}
                      </span>
                      <span className="font-mono text-[11px] text-ink-fog">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </span>
                    <span
                      className={`message-preview mt-1 block font-body text-sm text-ink-fog ${isOpen ? "message-preview-open" : ""}`}
                    >
                      {message.body}
                    </span>
                    {isOpen && message.image_url && (
                      <img
                        src={message.image_url}
                        alt="Prescription attached to this message"
                        className="message-attachment mt-3 max-h-72 w-full rounded-lg bg-white object-contain"
                      />
                    )}
                  </span>
                  <span className="font-body text-xs font-semibold text-indigo-deep">
                    {isOpen ? "Close" : "Open"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
