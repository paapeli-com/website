import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Code } from "../src/code";

describe("Code", () => {
  it("renders children correctly", () => {
    render(<Code>const test = 'hello';</Code>);
    expect(screen.getByText("const test = 'hello';")).toBeInTheDocument();
  });

  it("renders as a code element", () => {
    render(<Code>test code</Code>);
    const codeElement = screen.getByText("test code");
    expect(codeElement.tagName).toBe("CODE");
  });

  it("applies custom className", () => {
    render(<Code className="custom-code-class">test code</Code>);
    expect(screen.getByText("test code")).toHaveClass("custom-code-class");
  });

  it("renders multiple children", () => {
    render(
      <Code>
        line 1{"\n"}line 2
      </Code>
    );
    expect(screen.getByText(/line 1/)).toBeInTheDocument();
    expect(screen.getByText(/line 2/)).toBeInTheDocument();
  });

  it("renders without className when not provided", () => {
    render(<Code>test code</Code>);
    const codeElement = screen.getByText("test code");
    expect(codeElement.className).toBe("");
  });
});
