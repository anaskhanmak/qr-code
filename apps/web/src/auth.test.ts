import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthorizedUser } from "./lib/auth-credentials";

const { mockedFindUnique } = vi.hoisted(() => ({
  mockedFindUnique: vi.fn(),
}));

vi.mock("@loopmark/db", () => ({
  db: {
    user: { findUnique: mockedFindUnique },
  },
}));

describe("credential authorization", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
  });

  it("requires a verified email before allowing sign in", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "user_1",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hashed-password",
      emailVerified: null,
    });

    const result = await getAuthorizedUser("test@example.com", "password123");
    expect(result).toBeNull();
  });

  it("accepts only a matching password for a verified account", async () => {
    const passwordHash = await hash("secret-password", 10);
    mockedFindUnique.mockResolvedValue({
      id: "user_2",
      name: "Verified User",
      email: "verified@example.com",
      passwordHash,
      emailVerified: new Date("2025-01-01"),
    });

    const result = await getAuthorizedUser("verified@example.com", "secret-password");
    expect(result).toEqual({ id: "user_2", name: "Verified User", email: "verified@example.com" });
  });
});
