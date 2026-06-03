const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let customers = [];
let users = [
    { username: "yuangong", password: "123456", role: "user", name: "普通员工" },
    { username: "laoban", password: "admin123", role: "admin", name: "老板" }
];
let creditImages = [];

app.get('/api/customers', (req, res) => {
    res.json({ success: true, data: customers });
});

app.post('/api/customers', (req, res) => {
    const customer = req.body;
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
        customers[index] = customer;
    } else {
        customers.push(customer);
    }
    res.json({ success: true });
});

app.delete('/api/customers/:id', (req, res) => {
    customers = customers.filter(c => c.id !== parseInt(req.params.id));
    res.json({ success: true });
});

app.get('/api/users', (req, res) => {
    res.json({ success: true, data: users });
});

app.post('/api/users', (req, res) => {
    const user = req.body;
    if (users.find(u => u.username === user.username)) {
        return res.json({ success: false, error: '用户名已存在' });
    }
    users.push(user);
    res.json({ success: true });
});

app.get('/api/credit-images/:customerId', (req, res) => {
    const id = parseInt(req.params.customerId);
    const data = creditImages.find(c => c.customerId === id);
    res.json({ success: true, images: data ? data.images : [] });
});

app.post('/api/credit-images', (req, res) => {
    const { customerId, images } = req.body;
    const index = creditImages.findIndex(c => c.customerId === customerId);
    if (index >= 0) {
        creditImages[index] = { customerId, images };
    } else {
        creditImages.push({ customerId, images });
    }
    res.json({ success: true });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`✅ 服务器启动: http://localhost:${port}`);
});
