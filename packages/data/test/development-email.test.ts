import { describe, expect, it } from "vitest";

import { createConsoleEmailAdapter } from "../src/index.js";

describe("development email adapter", () => {
  it("logs auth and notification emails to the console adapter by default", async () => {
    const deliveries: Array<{
      occurredAt: string;
      preview: string;
      provider: "console";
      subject: string;
      to: readonly string[];
      type: "auth" | "notification";
    }> = [];
    const emailAdapter = createConsoleEmailAdapter({
      logger: (entry) => {
        deliveries.push(entry);
      },
      now: () => new Date("2026-04-23T12:00:00.000Z"),
    });

    await expect(
      emailAdapter.send({
        subject: "Magic link de desenvolvimento",
        text: "Abra o app local para continuar.",
        to: ["camila.colaborador@engaja.local"],
        type: "auth",
      }),
    ).resolves.toMatchObject({
      occurredAt: "2026-04-23T12:00:00.000Z",
      provider: "console",
      subject: "Magic link de desenvolvimento",
      to: ["camila.colaborador@engaja.local"],
      type: "auth",
    });

    expect(deliveries[0]?.preview).toContain("[email:console]");
  });
});
