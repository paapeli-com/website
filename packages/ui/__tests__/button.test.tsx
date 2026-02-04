import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Button } from "../src/button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button appName="test-app">Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("applies custom className", () => {
    render(
      <Button appName="test-app" className="custom-class">
        Click me
      </Button>
    );
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("shows alert with appName on click", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<Button appName="test-app">Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(alertSpy).toHaveBeenCalledWith("Hello from your test-app app!");
    expect(alertSpy).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });

  it("renders as a button element", () => {
    render(<Button appName="test-app">Click me</Button>);
    expect(screen.getByRole("button").tagName).toBe("BUTTON");
  });
});
