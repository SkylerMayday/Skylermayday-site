import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardZoomModal, { type CardZoomModalProps } from "./CardZoomModal";

const props = (overrides?: Partial<CardZoomModalProps>): CardZoomModalProps => ({
  imageUrl: "https://example.com/card.png",
  slotName: "Charizard",
  language: "EN",
  remarks: null,
  onClose: vi.fn(),
  ...overrides,
});

describe("CardZoomModal", () => {
  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<CardZoomModal {...props({ onClose })} />);
    fireEvent.click(screen.getByRole("button", { name: /close enlarged card/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop itself is clicked, but not when the image is clicked", () => {
    // CardZoomModal renders via a portal into document.body, so the backdrop
    // is never a descendant of RTL's own container — query document directly.
    const onClose = vi.fn();
    const first = render(<CardZoomModal {...props({ onClose })} />);
    const backdrop = document.querySelector(".card-zoom-backdrop") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
    first.unmount();

    const onClose2 = vi.fn();
    render(<CardZoomModal {...props({ onClose: onClose2 })} />);
    fireEvent.click(screen.getByRole("img"));
    expect(onClose2).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<CardZoomModal {...props({ onClose })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab/Shift+Tab inside the modal — focus never reaches an element on the page behind it", async () => {
    render(
      <>
        <button>Outside</button>
        <CardZoomModal {...props()} />
      </>
    );
    const closeButton = screen.getByRole("button", { name: /close enlarged card/i });
    expect(document.activeElement).toBe(closeButton);

    await userEvent.tab();
    expect(document.activeElement).toBe(closeButton);

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(closeButton);
  });

  it("shows the card image by default, and falls back to 'Image unavailable' text after the image errors", () => {
    const p = props();
    render(<CardZoomModal {...p} />);
    expect(screen.getByRole("img", { name: p.slotName })).toBeInTheDocument();

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
    expect(screen.getByText(p.slotName)).toBeInTheDocument();
  });
});
