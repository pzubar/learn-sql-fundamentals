import * as sqlite from 'sqlite';
import { getDb } from '../db/utils';

const ALL_ORDERS_COLUMNS = ['*'];

export async function getAllOrders(): Promise<Order[]> {
  const db = await getDb('dev');
  return await db.all(`
SELECT ${ALL_ORDERS_COLUMNS.join(',')}
FROM "Order"`);
}

export async function getOrder(id: string | number): Promise<Order[]> {
  const db = await getDb('dev');
  return await db.get(
    `
SELECT *
FROM "Order"
WHERE Id = $1
`,
    id
  );
}