import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "./ContactForm";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText("Name"), "Ash Ketchum");
  await userEvent.type(screen.getByLabelText("Email"), "ash@example.com");
  await userEvent.type(
    screen.getByLabelText("Message"),
    "I would like to buy this card, please let me know."
  );
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows validation errors and does not call fetch when required fields are empty", async () => {
    render(<ContactForm />);
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Message")).toHaveAttribute("aria-invalid", "true");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a malformed email without calling fetch", async () => {
    render(<ContactForm />);
    await userEvent.type(screen.getByLabelText("Name"), "Ash Ketchum");
    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.type(
      screen.getByLabelText("Message"),
      "I would like to buy this card, please let me know."
    );
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Message")).not.toHaveAttribute("aria-invalid");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows 'Sending…', disables the button, and does NOT dim it via opacity while the submission is pending", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    vi.mocked(fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }) as unknown as ReturnType<typeof fetch>
    );

    render(<ContactForm />);
    await fillValidForm();

    const submitButton = screen.getByRole("button", { name: /send message/i });
    // Deliberately not awaited — fetch is stubbed to stay pending, so this
    // click's promise won't resolve until we resolveFetch() below. Awaiting
    // it here would deadlock the test.
    void userEvent.click(submitButton);

    const pendingButton = await screen.findByRole("button", { name: /sending/i });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton.className).not.toMatch(/opacity-/);

    resolveFetch({ ok: true, json: async () => ({ ok: true }) });
  });

  it("shows the success message and replaces the form after a successful submission", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    render(<ContactForm />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/thanks/i);
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("preserves the name/email/message field values and shows the field-specific message when the server returns a validation error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: "validation", fields: ["email"] }),
    } as Response);

    render(<ContactForm />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    await screen.findByRole("alert");
    expect(screen.getByLabelText("Name")).toHaveValue("Ash Ketchum");
    expect(screen.getByLabelText("Message")).toHaveValue(
      "I would like to buy this card, please let me know."
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please check the highlighted fields and try again."
    );
  });

  it("shows a generic error message on a non-validation server failure, without clearing the form", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: "delivery" }),
    } as Response);

    render(<ContactForm />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong sending your message. Please try again."
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Ash Ketchum");
  });
});
