import http from "node:http";

import { createInMemoryAuthRepository } from "@engaja/data";
import { hashPassword } from "@engaja/security";

import { createApiApp } from "./dist/index.js";

const now = new Date("2026-04-24T12:00:00.000Z");
const password = "SenhaSegura123!";
const passwordHash = await hashPassword(password, { salt: "auth-invites-test" });

const users = [
  {
    active: true,
    createdAt: now,
    displayName: "Rafael Lider",
    email: "rafael.lider@engaja.test",
    id: "user_lider",
    updatedAt: now,
  },
  {
    active: true,
    createdAt: now,
    displayName: "Camila Colaboradora",
    email: "camila.colaborador@engaja.test",
    id: "user_colaborador",
    updatedAt: now,
  },
];

const credentials = users.map((user) => ({
  createdAt: now,
  email: user.email,
  failedAttemptCount: 0,
  id: `credential_${user.id}`,
  passwordHash,
  passwordHashVersion: "scrypt",
  status: "active",
  updatedAt: now,
  user,
  userId: user.id,
}));

const memberships = [
  {
    createdAt: now,
    departmentId: "dept_flv",
    id: "membership_lider",
    organizationId: "org_demo",
    roleCode: "lider-setor",
    roleId: "role_lider-setor",
    status: "active",
    storeId: "store_001",
    updatedAt: now,
    userId: "user_lider",
  },
  {
    createdAt: now,
    departmentId: "dept_flv",
    id: "membership_colaborador",
    organizationId: "org_demo",
    roleCode: "colaborador",
    roleId: "role_colaborador",
    status: "active",
    storeId: "store_001",
    updatedAt: now,
    userId: "user_colaborador",
  },
];

const app = createApiApp({
  authRepository: createInMemoryAuthRepository({ credentials, memberships, users }),
  inviteBaseUrl: "http://192.168.3.118:3000/convite",
  inviteSecret: "development-invite-secret-value",
  now: () => new Date(),
  sessionSecret: "development-session-secret-value",
});

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = chunks.length === 0 ? undefined : Buffer.concat(chunks);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, item);
        }
      } else {
        headers.set(key, value);
      }
    }

    const url = `http://${req.headers.host ?? "192.168.3.118:3000"}${req.url ?? "/"}`;
    const request = new Request(url, {
      body,
      headers,
      method: req.method,
    });
    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: {
          code: "dev_api_error",
          message: "Temporary dev API failed.",
        },
      }),
    );
  }
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Temporary Engaja API listening on http://0.0.0.0:3000");
  console.log("Login: rafael.lider@engaja.test / SenhaSegura123!");
  console.log("Login: camila.colaborador@engaja.test / SenhaSegura123!");
});
