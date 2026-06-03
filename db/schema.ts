import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: integer().primaryKey(),
  data: jsonb().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  username: text().primaryKey(),
  password: text().notNull(),
  role: text().notNull().default("user"),
  name: text().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creditImages = pgTable("credit_images", {
  customerId: integer("customer_id").primaryKey(),
  images: jsonb().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
