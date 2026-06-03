import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import type { db as dbType } from "../../db/index.js";
import type * as schemaType from "../../db/schema.js";

const defaultUsers = [
  { username: "yuangong", password: "123456", role: "user", name: "普通员工" },
  { username: "laoban", password: "admin123", role: "admin", name: "老板" },
];

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      ...(init?.headers || {}),
    },
    ...init,
  });
}

async function getDatabase() {
  const [{ db }, schema] = await Promise.all([
    import("../../db/index.js") as Promise<{ db: typeof dbType }>,
    import("../../db/schema.js") as Promise<typeof schemaType>,
  ]);

  return { db, ...schema };
}

async function ensureDefaultUsers() {
  const { db, users } = await getDatabase();

  for (const user of defaultUsers) {
    await db.insert(users).values(user).onConflictDoNothing();
  }
}

async function readBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return json({ success: true });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/\.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";

  try {
    if (path === "/health" && req.method === "GET") {
      return json({ status: "ok", timestamp: new Date().toISOString() });
    }

    if (path === "/customers" && req.method === "GET") {
      const { db, customers } = await getDatabase();
      const rows = await db.select().from(customers);
      return json({ success: true, data: rows.map((row) => row.data) });
    }

    if (path === "/customers" && req.method === "POST") {
      const { db, customers } = await getDatabase();
      const customer = await readBody(req);
      if (!customer || typeof customer.id !== "number") {
        return json({ success: false, error: "客户数据缺少有效 ID" }, { status: 400 });
      }

      await db
        .insert(customers)
        .values({ id: customer.id, data: customer, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: customers.id,
          set: { data: customer, updatedAt: new Date() },
        });

      return json({ success: true });
    }

    if (path === "/customers/batch" && req.method === "POST") {
      const { db, customers } = await getDatabase();
      const body = await readBody(req);
      if (!Array.isArray(body)) {
        return json({ success: false, error: "批量客户数据必须是数组" }, { status: 400 });
      }

      await db.delete(customers);
      if (body.length) {
        await db.insert(customers).values(
          body.map((customer) => ({
            id: Number(customer.id),
            data: { ...customer, id: Number(customer.id) },
            updatedAt: new Date(),
          })),
        );
      }

      return json({ success: true });
    }

    const customerDeleteMatch = path.match(/^\/customers\/(\d+)$/);
    if (customerDeleteMatch && req.method === "DELETE") {
      const { db, customers } = await getDatabase();
      await db.delete(customers).where(eq(customers.id, Number(customerDeleteMatch[1])));
      return json({ success: true });
    }

    if (path === "/users" && req.method === "GET") {
      await ensureDefaultUsers();
      const { db, users } = await getDatabase();
      const rows = await db.select().from(users);
      return json({ success: true, data: rows });
    }

    if (path === "/users" && req.method === "POST") {
      const { db, users } = await getDatabase();
      const user = await readBody(req);
      if (!user?.username || !user?.password || !user?.name) {
        return json({ success: false, error: "用户信息不完整" }, { status: 400 });
      }

      const existing = await db.select().from(users).where(eq(users.username, user.username));
      if (existing.length) {
        return json({ success: false, error: "用户名已存在" });
      }

      await db.insert(users).values({
        username: user.username,
        password: user.password,
        role: user.role || "user",
        name: user.name,
      });

      return json({ success: true });
    }

    const imageMatch = path.match(/^\/credit-images\/(\d+)$/);
    if (imageMatch && req.method === "GET") {
      const { db, creditImages } = await getDatabase();
      const rows = await db.select().from(creditImages).where(eq(creditImages.customerId, Number(imageMatch[1])));
      return json({ success: true, images: rows[0]?.images || [] });
    }

    if (path === "/credit-images" && req.method === "POST") {
      const { db, creditImages } = await getDatabase();
      const body = await readBody(req);
      if (typeof body?.customerId !== "number" || !Array.isArray(body?.images)) {
        return json({ success: false, error: "征信图片数据不完整" }, { status: 400 });
      }

      await db
        .insert(creditImages)
        .values({ customerId: body.customerId, images: body.images, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: creditImages.customerId,
          set: { images: body.images, updatedAt: new Date() },
        });

      return json({ success: true });
    }

    return json({ success: false, error: "接口不存在" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return json({ success: false, error: message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/*",
};
