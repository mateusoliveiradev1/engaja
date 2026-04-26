import { randomUUID } from "node:crypto";

export interface DevelopmentEmailMessage {
  readonly html?: string;
  readonly subject: string;
  readonly tags?: readonly string[];
  readonly text: string;
  readonly to: readonly string[];
  readonly type: "auth" | "notification";
}

export interface DevelopmentEmailDelivery {
  readonly id: string;
  readonly occurredAt: string;
  readonly provider: "console";
  readonly subject: string;
  readonly to: readonly string[];
  readonly type: DevelopmentEmailMessage["type"];
}

export interface DevelopmentEmailAdapter {
  readonly provider: DevelopmentEmailDelivery["provider"];
  send(message: DevelopmentEmailMessage): Promise<DevelopmentEmailDelivery>;
}

export interface ConsoleEmailAdapterOptions {
  readonly logger?: (entry: DevelopmentEmailDelivery & { readonly preview: string }) => void;
  readonly now?: () => Date;
}

export function createConsoleEmailAdapter(
  options: ConsoleEmailAdapterOptions = {},
): DevelopmentEmailAdapter {
  const now = options.now ?? (() => new Date());
  const logger =
    options.logger ??
    ((entry: DevelopmentEmailDelivery & { readonly preview: string }) => {
      console.info(entry.preview);
    });

  return {
    provider: "console",
    send(message) {
      const occurredAt = now();
      const delivery = {
        id: randomUUID(),
        occurredAt: occurredAt.toISOString(),
        provider: "console" as const,
        subject: message.subject,
        to: [...message.to],
        type: message.type,
      };

      logger({
        ...delivery,
        preview: [
          "[email:console]",
          `type=${message.type}`,
          `to=${message.to.join(",")}`,
          `subject=${message.subject}`,
          `text=${message.text}`,
        ].join(" "),
      });

      return Promise.resolve(delivery);
    },
  };
}
