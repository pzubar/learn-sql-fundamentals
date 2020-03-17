-- Put your SQLite "up" migration here
CREATE INDEX IF NOT EXISTS orderdetailuniqueproduct ON OrderDetail(orderid, productid)
