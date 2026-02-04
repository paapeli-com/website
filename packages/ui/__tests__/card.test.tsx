import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "../src/card";

describe("Card", () => {
  it("renders title correctly", () => {
    render(
      <Card title="Test Card" href="https://example.com">
        Test content
      </Card>
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Test Card");
  });

  it("renders children correctly", () => {
    render(
      <Card title="Test Card" href="https://example.com">
        Test content
      </Card>
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders as a link with correct href", () => {
    render(
      <Card title="Test Card" href="https://example.com">
        Test content
      </Card>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://example.com?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"
    );
  });

  it("has correct link attributes", () => {
    render(
      <Card title="Test Card" href="https://example.com">
        Test content
      </Card>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("applies custom className", () => {
    render(
      <Card title="Test Card" href="https://example.com" className="custom-class">
        Test content
      </Card>
    );
    expect(screen.getByRole("link")).toHaveClass("custom-class");
  });

  it("renders arrow span", () => {
    render(
      <Card title="Test Card" href="https://example.com">
        Test content
      </Card>
    );
    expect(screen.getByText("->")).toBeInTheDocument();
  });
});
