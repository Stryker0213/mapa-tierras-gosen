import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const points = sqliteTable('points', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  description: text('description').notNull(),
  images: text('images').notNull().default('[]'),
  airbnb: text('airbnb'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull(),
});
