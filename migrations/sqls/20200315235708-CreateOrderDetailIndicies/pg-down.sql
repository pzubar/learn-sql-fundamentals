-- Put your PostgreSQL "down" migration here
DROP INDEX IF EXISTS order_detail_product_order_id;
