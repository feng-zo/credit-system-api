const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 内存存储
let customers = [];
let users = [
    { username: "yuangong", password: "123456", role: "user", name: "普通员工" },
    { username: "laoban", password: "admin123", role: "admin", name: "老板" }
];
let creditImages = [];

// ========== API 接口 ==========

// 获取所有客户
app.get('/api/customers', (req, res) => {
    res.json({ success: true, data: customers });
});

// 保存单个客户
app.post('/api/customers', (req, res) => {
    try {
        const customer = req.body;
        const index = customers.findIndex(c => c.id === customer.id);
        if (index >= 0) {
            customers[index] = customer;
        } else {
            customers.push(customer);
        }
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 批量保存客户
app.post('/api/customers/batch', (req, res) => {
    try {
        customers = req.body;
        res.json({ success: true, count: customers.length });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 删除客户
app.delete('/api/customers/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        customers = customers.filter(c => c.id !== id);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 获取所有用户
app.get('/api/users', (req, res) => {
    res.json({ success: true, data: users });
});

// 注册用户
app.post('/api/users', (req, res) => {
    try {
        const user = req.body;
        if (users.find(u => u.username === user.username)) {
            return res.json({ success: false, error: '用户名已存在' });
        }
        users.push(user);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 获取征信图片
app.get('/api/credit-images/:customerId', (req, res) => {
    try {
        const id = parseInt(req.params.customerId);
        const data = creditImages.find(c => c.customerId === id);
        res.json({ success: true, images: data ? data.images : [] });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 保存征信图片
app.post('/api/credit-images', (req, res) => {
    try {
        const { customerId, images } = req.body;
        const index = creditImages.findIndex(c => c.customerId === customerId);
        if (index >= 0) {
            creditImages[index] = { customerId, images, updateTime: new Date() };
        } else {
            creditImages.push({ customerId, images, updateTime: new Date() });
        }
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 删除征信图片
app.delete('/api/credit-images/:customerId', (req, res) => {
    try {
        const id = parseInt(req.params.customerId);
        creditImages = creditImages.filter(c => c.customerId !== id);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 清空所有客户
app.delete('/api/customers/all', (req, res) => {
    try {
        customers = [];
        creditImages = [];
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ 服务器启动成功！`);
    console.log(`📡 端口: ${port}`);
    console.log(`🌐 地址: http://0.0.0.0:${port}`);
});
