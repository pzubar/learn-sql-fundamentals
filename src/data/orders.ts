import { getDb } from '../db/utils';
import { sql } from '../sql-string';
import or from '../helpers/or';

export const ALL_ORDERS_COLUMNS = ['*'];
export const ORDER_COLUMNS = ['id AS id',
  'customerid',
  'employeeid',
  'shipcity',
  'shipcountry',
  'shippeddate'];

/**
 * @typedef OrderCollectionOptions
 * @property {number} page Page number (zero-indexed)
 * @property {number} perPage Results per page
 * @property {string} sort Property to sort by
 * @property {'asc'|'desc'} order Sort direction
 * @property {string|undefined} customerId Sort direction
 * @description Options that may be used to customize a query for a collection of CustomerOrder records
 */

/**
 * Defaults values to use when parts of OrderCollectionOptions are not provided
 * @type {Readonly<OrderCollectionOptions>}
 */
const DEFAULT_ORDER_COLLECTION_OPTIONS = Object.freeze(
  /**
   * @type {OrderCollectionOptions}
   *
   */ ({
    order: 'asc',
    page: 1,
    perPage: 20,
    sort: 'id',
    customerId: undefined
  })
);

/**
 * Retrieve a collection of "all orders" from the database.
 * NOTE: This table has tens of thousands of records, so we'll probably have to apply
 *    some strategy for viewing only a part of the collection at any given time
 * @param {Partial<OrderCollectionOptions>} opts Options for customizing the query
 * @returns {Promise<Order[]>} the orders
 */
export async function getAllOrders(opts = {}) {
  // Combine the options passed into the function with the defaults

  /** @type {OrderCollectionOptions} */
  const options = {
    ...DEFAULT_ORDER_COLLECTION_OPTIONS,
    ...opts
  };
  const { sort, order, perPage, page, customerId } = options;
  const whereCustomer = customerId ? sql`WHERE CustomerOrder.customerid = '${customerId}'` : '';
  const db = await getDb();

  return await db.all(sql`
SELECT ${ORDER_COLUMNS.map(col => `CustomerOrder.${col}`).join(',')},
  Customer.companyname AS customername, Employee.lastname AS employeename
FROM CustomerOrder
LEFT JOIN Customer ON Customer.id = customerid
LEFT JOIN Employee ON Employee.id = employeeid
${whereCustomer}
ORDER BY ${sort} ${order}
LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`);
}

/**
 * Retrieve a list of CustomerOrder records associated with a particular Customer
 * @param {string} customerId Customer id
 * @param {Partial<OrderCollectionOptions>} opts Options for customizing the query
 */
export async function getCustomerOrders(customerId, opts = {}) {
  return getAllOrders({ sort: 'shippeddate', order: 'asc', customerId, ...opts });
}

/**
 * Retrieve an individual CustomerOrder record by id
 * @param {string | number} id CustomerOrder id
 * @returns {Promise<Order>} the order
 */
export async function getOrder(id) {
  const db = await getDb();
  return await db.get(
    sql`
      SELECT co.*,
             c.companyname                                       AS customername,
             e.firstname || ' ' || e.lastname                    AS employeename,
             SUM(od.unitprice * od.quantity * (1 - od.discount)) AS subtotal
      FROM CustomerOrder AS co
             LEFT JOIN Customer AS c ON co.customerid = c.id
             LEFT JOIN Employee AS e ON co.employeeid = e.id
             LEFT JOIN OrderDetail AS od ON od.orderid = co.id
      WHERE co.id = $1
    `,
    id
  );
}

/**
 * Get the OrderDetail records associated with a particular CustomerOrder record
 * @param {string | number} id CustomerOrder id
 * @returns {Promise<OrderDetail[]>} the order details
 */
export async function getOrderDetails(id) {
  const db = await getDb();
  return await db.all(
    sql`
      SELECT od.*, od.unitprice * od.quantity AS price, p.productname as productname
      FROM OrderDetail AS od
             LEFT JOIN Product AS p ON p.id = od.productid
      WHERE orderid = $1`,
    id
  );
}

/**
 * Get a CustomerOrder record, and its associated OrderDetails records
 * @param {string | number} id CustomerOrder id
 * @returns {Promise<[Order, OrderDetail[]]>} the order and respective order details
 */
export async function getOrderWithDetails(id) {
  let order = await getOrder(id);
  let items = await getOrderDetails(id);
  return [order, items];
}

type CreateOrder = Pick<Order, 'employeeid' | 'customerid' | 'shipcity' | 'shipaddress' | 'shipname' | 'shipvia' | 'shipregion' | 'shipcountry' | 'shippostalcode' | 'requireddate' | 'freight'>
type CreateOrderDetails = Array<Pick<OrderDetail, 'productid' | 'quantity' | 'unitprice' | 'discount'>>

/**
 * Create a new CustomerOrder record
 * @param {Pick<Order, 'employeeid' | 'customerid' | 'shipcity' | 'shipaddress' | 'shipname' | 'shipvia' | 'shipregion' | 'shipcountry' | 'shippostalcode' | 'requireddate' | 'freight'>} order data for the new CustomerOrder
 * @param {Array<Pick<OrderDetail, 'productid' | 'quantity' | 'unitprice' | 'discount'>>} details data for any OrderDetail records to associate with this new CustomerOrder
 * @returns {Promise<{id: string}>} the newly created order
 */
export async function createOrder(order: CreateOrder, details: CreateOrderDetails = []): Promise<{ id: string }> {
  const db = await getDb();
  const result = await db.run(
    sql`
INSERT INTO CustomerOrder(${Object.keys(order).join(', ')})
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, Object.values(order));

  if (!result || typeof result.lastID === 'undefined') {
    throw new Error('govno');
  }
  return { id: result.lastID };
}

/**
 * Delete a CustomerOrder from the database
 * @param {string | number} id CustomerOrder id
 * @returns {Promise<any>}
 */
export async function deleteOrder(id) {
  const db = await getDb();

  return await db.run(sql`DELETE
                          FROM OrderDetail
                          WHERE id = $1`, id);
}

/**
 * Update a CustomerOrder, and its associated OrderDetail records
 * @param {string | number} id CustomerOrder id
 * @param {Pick<Order, 'employeeid' | 'customerid' | 'shipcity' | 'shipaddress' | 'shipname' | 'shipvia' | 'shipregion' | 'shipcountry' | 'shippostalcode' | 'requireddate' | 'freight'>} data data for the new CustomerOrder
 * @param {Array<Pick<OrderDetail, 'id' | 'productid' | 'quantity' | 'unitprice' | 'discount'>>} details data for any OrderDetail records to associate with this new CustomerOrder
 * @returns {Promise<Partial<Order>>} the order
 */
export async function updateOrder(id, data, details = []) {
  return Promise.reject('Orders#updateOrder() NOT YET IMPLEMENTED');
}
