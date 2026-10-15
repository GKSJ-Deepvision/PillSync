import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfilePhoto from "../../src/components/common/ProfilePhoto";

describe("ProfilePhoto", () => {
  it("shows the uploaded profile image", () => {
    render(<ProfilePhoto src="https://images.example.test/avatar.webp" name="Asha Rao" />);

    expect(document.querySelector("img")).toHaveAttribute("src", "https://images.example.test/avatar.webp");
  });

  it("falls back to the user's initials when no photo exists", () => {
    render(<ProfilePhoto name="Asha Rao" />);

    expect(screen.getByText("AR")).toBeInTheDocument();
  });
});