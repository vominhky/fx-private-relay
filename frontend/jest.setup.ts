import { expect } from "@jest/globals";
import "@testing-library/jest-dom/extend-expect";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
