CREATE INDEX orderemployeeid ON CustomerOrder(employeeid);
CREATE INDEX ordercustomerid ON CustomerOrder(customerid);

CREATE INDEX productsupplierid ON Product(supplierid);

CREATE INDEX employeereportsto ON Employee(reportsto);
