import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders main app structure", () => {
  render(<App />);
  // Check for a main element (semantic HTML)
  const mainElement = screen.getByRole("main");
  expect(mainElement).toBeInTheDocument();
});
