import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MessageInbox from "../../src/components/dashboard/MessageInbox";

describe("MessageInbox", () => {
  it("shows a toggle button and reveals messages only after it is clicked", () => {
    const messages = [
      { id: "m1", title: "Care plan update", body: "Your refill is ready.", created_at: "2026-01-02T08:00:00Z" },
    ];

    render(<MessageInbox messages={messages} defaultCollapsed />);

    expect(screen.getByRole("button", { name: /view messages/i })).toBeInTheDocument();
    expect(screen.queryByText("Care plan update")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view messages/i }));

    expect(screen.getByText("Care plan update")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hide messages/i })).toBeInTheDocument();
  });
});
