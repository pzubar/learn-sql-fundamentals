-- Put your PostgreSQL "up" migration here
CREATE INDEX order_detail_product_order_id ON OrderDetail(productid, orderid)
