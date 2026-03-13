
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM Shim for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- WEBSOCKETS ---
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
  });
  
  socket.on('send_message', (msg) => {
    io.emit('new_message', msg);
  });

  socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// --- API ROUTES ---

// HEALTH CHECK
app.get('/api/health', (req, res) => {
    // @ts-ignore
    res.json({ status: 'online', timestamp: Date.now(), uptime: process.uptime() });
});

// FACTORY RESET
app.post('/api/reset', async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.orderItem.deleteMany(),
            prisma.order.deleteMany(),
            prisma.reservation.deleteMany(),
            prisma.waitlistEntry.deleteMany(),
            prisma.cashTransaction.deleteMany(),
            prisma.zReport.deleteMany(),
            prisma.logbookEntry.deleteMany(),
            prisma.auditLog.deleteMany(),
            prisma.systemNotification.deleteMany(),
            prisma.chatMessage.deleteMany(),
            prisma.wasteLog.deleteMany(),
            prisma.invoice.deleteMany(),
            prisma.feedback.deleteMany(),
            prisma.recipeItem.deleteMany(),
            prisma.product.deleteMany(),
            prisma.ingredient.deleteMany(),
            prisma.table.deleteMany()
        ]);
        
        // Re-seed Admin
        const adminExists = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (!adminExists) {
            await prisma.user.create({ data: { name: 'Admin', pin: '0000', role: 'admin', active: true } });
        }
        
        // Re-seed tables
        for(let i=1; i<=12; i++) {
            await prisma.table.create({ data: { id: i, zone: 'Interior', seats: 4, occupied: false, reserved: false, shape: 'square', x: (i%4)*20 + 10, y: Math.floor(i/4)*20 + 10 } });
        }

        res.json({ success: true, message: 'System Reset Complete' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Reset failed' });
    }
});

// DATA SEEDING
app.post('/api/seed', async (req, res) => {
    try {
        // Seed Users
        if ((await prisma.user.count()) === 0) {
            await prisma.user.createMany({
                data: [
                    { name: 'Admin', pin: '0000', role: 'admin', active: true },
                    { name: 'Ospatar 1', pin: '1111', role: 'waiter', active: true },
                    { name: 'Chef', pin: '2222', role: 'chef', active: true },
                    { name: 'Sofer', pin: '3333', role: 'driver', active: true }
                ]
            });
        }

        // Seed Tables
        if ((await prisma.table.count()) === 0) {
            for(let i=1; i<=12; i++) await prisma.table.create({ data: { id: i, zone: 'Interior', seats: 4, occupied: false, reserved: false, shape: 'square', x: (i%4)*20 + 10, y: Math.floor(i/4)*20 + 10 } });
        }

        // Seed Settings
        await prisma.systemSettings.upsert({
            where: { id: 'default' }, update: {},
            create: { id: 'default', data: JSON.stringify({ restaurantName: 'HorecaAI Bistro', currency: 'RON', setupCompleted: true }) }
        });

        // Seed Menu
        if ((await prisma.product.count()) === 0) {
            const burger = await prisma.product.create({ data: { name: 'Burger Vita', price: 45, category: 'Mancare', station: 'Grill', active: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' } });
            await prisma.product.create({ data: { name: 'Limonada', price: 18, category: 'Bauturi', station: 'Bar', active: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60' } });
            
            // Ingredients
            const meat = await prisma.ingredient.create({ data: { name: 'Carne Vita', unit: 'kg', costPerUnit: 40, currentStock: 10, minStockAlert: 2 } });
            const bun = await prisma.ingredient.create({ data: { name: 'Chifla', unit: 'buc', costPerUnit: 2, currentStock: 50, minStockAlert: 10 } });
            
            await prisma.recipeItem.create({ data: { productId: burger.id, ingredientId: meat.id, quantity: 0.2 } });
            await prisma.recipeItem.create({ data: { productId: burger.id, ingredientId: bun.id, quantity: 1 } });
        }

        res.json({ success: true, message: 'Seeding Complete' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Seed failed' });
    }
});

// GENERIC CRUD UTILS
const createCRUDRoutes = (path: string, model: any) => {
    app.get(`/api/${path}`, async (req, res) => res.json(await model.findMany()));
    app.post(`/api/${path}`, async (req, res) => res.json(await model.create({ data: req.body })));
    app.put(`/api/${path}/:id`, async (req, res) => res.json(await model.update({ where: { id: req.params.id }, data: req.body })));
    app.delete(`/api/${path}/:id`, async (req, res) => res.json(await model.delete({ where: { id: req.params.id } })));
};

// Standard Entities
createCRUDRoutes('events', prisma.event);
createCRUDRoutes('suppliers', prisma.supplier);
createCRUDRoutes('giftcards', prisma.giftCard);
createCRUDRoutes('assets', prisma.asset);
createCRUDRoutes('coatcheck', prisma.coatCheckTicket);
createCRUDRoutes('lostfound', prisma.lostItem);
createCRUDRoutes('laundry', prisma.laundryItem);
createCRUDRoutes('waitlist', prisma.waitlistEntry);
createCRUDRoutes('feedback', prisma.feedback);
createCRUDRoutes('skills', prisma.skill);
createCRUDRoutes('cleaning', prisma.cleaningTask);

// --- CORE MODULES ---

// SETTINGS
app.get('/api/settings', async (req, res) => {
    const s = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
    res.json(s ? JSON.parse(s.data) : {});
});
app.post('/api/settings', async (req, res) => {
    await prisma.systemSettings.upsert({ where: { id: 'default' }, update: { data: JSON.stringify(req.body) }, create: { id: 'default', data: JSON.stringify(req.body) } });
    res.json({ success: true });
});
app.post('/api/settings/backup', async (req, res) => res.json({ success: true }));
app.get('/api/backups', async (req, res) => res.json([{ id: '1', date: new Date().toISOString(), size: '15MB', type: 'daily', status: 'success' }]));

// TABLES
app.get('/api/tables', async (req, res) => res.json(await prisma.table.findMany()));
app.post('/api/tables', async (req, res) => {
    await prisma.table.deleteMany({});
    for (const t of req.body) await prisma.table.create({ data: t });
    res.json({ success: true });
});

// MENU
app.get('/api/menu', async (req, res) => {
  const products = await prisma.product.findMany({ include: { recipe: true } });
  res.json(products.map(p => ({ ...p, allergens: p.allergens ? JSON.parse(p.allergens) : [], modifiers: p.modifiers ? JSON.parse(p.modifiers) : [], instructions: p.instructions ? JSON.parse(p.instructions) : [] })));
});
app.post('/api/menu', async (req, res) => {
  const { allergens, modifiers, instructions, recipe, ...rest } = req.body;
  if (rest.id) await prisma.recipeItem.deleteMany({ where: { productId: rest.id } });
  const product = await prisma.product.upsert({
      where: { id: rest.id || 'new' },
      update: { ...rest, allergens: JSON.stringify(allergens), modifiers: JSON.stringify(modifiers), instructions: JSON.stringify(instructions), recipe: { create: recipe } },
      create: { ...rest, allergens: JSON.stringify(allergens), modifiers: JSON.stringify(modifiers), instructions: JSON.stringify(instructions), recipe: { create: recipe } }
  });
  res.json(product);
});
app.get('/api/menu/schedules', async (req, res) => {
    const s = await prisma.menuSchedule.findMany();
    res.json(s.map(x => ({...x, activeDays: JSON.parse(x.activeDays), categories: JSON.parse(x.categories)})));
});
app.post('/api/menu/schedules', async (req, res) => {
    const { activeDays, categories, ...rest } = req.body;
    res.json(await prisma.menuSchedule.create({ data: { ...rest, activeDays: JSON.stringify(activeDays), categories: JSON.stringify(categories) } }));
});

// ORDERS & POS
app.get('/api/orders', async (req, res) => {
  const orders = await prisma.order.findMany({ where: { status: { notIn: ['paid', 'cancelled'] } }, include: { items: true } });
  res.json(orders.map(o => ({ ...o, deliveryInfo: o.deliveryInfo ? JSON.parse(o.deliveryInfo) : null, splitBill: o.splitBill ? JSON.parse(o.splitBill) : null, courseStatus: o.courseStatus ? JSON.parse(o.courseStatus) : null, items: o.items.map(i => ({...i, selectedModifiers: i.selectedModifiers ? JSON.parse(i.selectedModifiers) : []})) })));
});
app.get('/api/archive', async (req, res) => {
    const orders = await prisma.order.findMany({ where: { status: { in: ['paid', 'cancelled'] } }, include: { items: true }, orderBy: { timestamp: 'desc' }, take: 100 });
    res.json(orders.map(o => ({ ...o, deliveryInfo: o.deliveryInfo ? JSON.parse(o.deliveryInfo) : null, items: o.items.map(i => ({...i, selectedModifiers: i.selectedModifiers ? JSON.parse(i.selectedModifiers) : []})) })));
});
app.post('/api/orders', async (req, res) => {
  const { items, deliveryInfo, courseStatus, splitBill, ...rest } = req.body;
  const order = await prisma.order.create({
      data: { ...rest, status: 'pending', deliveryInfo: deliveryInfo ? JSON.stringify(deliveryInfo) : null, courseStatus: courseStatus ? JSON.stringify(courseStatus) : null, items: { create: items.map((i: any) => ({ ...i, selectedModifiers: JSON.stringify(i.selectedModifiers) })) } },
      include: { items: true }
  });
  // Stock Deduction
  for (const item of items) {
      if (item.id) {
          const product = await prisma.product.findUnique({ where: { id: item.id }, include: { recipe: true } });
          if (product?.recipe) {
              for (const rItem of product.recipe) {
                  await prisma.ingredient.update({ where: { id: rItem.ingredientId }, data: { currentStock: { decrement: rItem.quantity * item.quantity } } });
              }
          }
      }
  }
  io.emit('new_order', order);
  res.json(order);
});
app.put('/api/orders/:id', async (req, res) => {
    const { items, deliveryInfo, courseStatus, splitBill, ...rest } = req.body;
    const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { ...rest, deliveryInfo: deliveryInfo ? JSON.stringify(deliveryInfo) : undefined, courseStatus: courseStatus ? JSON.stringify(courseStatus) : undefined, splitBill: splitBill ? JSON.stringify(splitBill) : undefined },
        include: { items: true }
    });
    io.emit('order_update', order);
    res.json(order);
});
app.put('/api/orders/:id/status', async (req, res) => {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: req.body.status }, include: { items: true } });
    io.emit('order_update', order);
    res.json(order);
});
app.put('/api/orders/:id/items/:itemId/status', async (req, res) => {
    await prisma.orderItem.update({ where: { id: req.params.itemId }, data: { status: req.body.status } });
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    io.emit('order_update', order);
    res.json(order);
});
app.post('/api/orders/:id/void', async (req, res) => {
    const { itemIdx, reason, returnStock, user } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (order && order.items[itemIdx]) {
        const item = order.items[itemIdx];
        if(returnStock && item.productId) {
            const prod = await prisma.product.findUnique({ where: { id: item.productId }, include: { recipe: true } });
            if(prod?.recipe) {
                for(const r of prod.recipe) {
                    await prisma.ingredient.update({ where: { id: r.ingredientId }, data: { currentStock: { increment: r.quantity * item.quantity } } });
                }
            }
        }
        await prisma.orderItem.delete({ where: { id: item.id } });
        const newTotal = order.total - (item.price * item.quantity);
        const updated = await prisma.order.update({ where: { id: order.id }, data: { total: newTotal }, include: { items: true } });
        await prisma.auditLog.create({ data: { action: 'VOID', user, details: `Voided ${item.name} from ${order.id}. Reason: ${reason}`, timestamp: Date.now() } });
        io.emit('order_update', updated);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});
app.post('/api/orders/transfer', async (req, res) => {
    const { fromTableId, toTableId, user } = req.body;
    const source = await prisma.order.findFirst({ where: { tableId: fromTableId, status: { notIn: ['paid'] } }, include: { items: true } });
    if(!source) return res.status(404).json({error: 'No order'});
    const target = await prisma.order.findFirst({ where: { tableId: toTableId, status: { notIn: ['paid'] } } });
    
    if(target) {
        await prisma.orderItem.updateMany({ where: { orderId: source.id }, data: { orderId: target.id } });
        await prisma.order.update({ where: { id: target.id }, data: { total: { increment: source.total } } });
        await prisma.order.delete({ where: { id: source.id } });
    } else {
        await prisma.order.update({ where: { id: source.id }, data: { tableId: toTableId } });
    }
    await prisma.table.update({ where: { id: fromTableId }, data: { occupied: false } });
    await prisma.table.update({ where: { id: toTableId }, data: { occupied: true } });
    await prisma.auditLog.create({ data: { action: 'TRANSFER', user, details: `Transfer ${fromTableId} -> ${toTableId}`, timestamp: Date.now() } });
    res.json({ success: true });
});

// INVENTORY
app.get('/api/inventory', async (req, res) => {
    const ings = await prisma.ingredient.findMany({ include: { supplier: true } });
    res.json(ings.map(i => ({...i, priceHistory: i.priceHistory ? JSON.parse(i.priceHistory) : []})));
});
app.post('/api/inventory/nir', async (req, res) => {
    const { items, supplierId, invoiceNumber } = req.body;
    await prisma.invoice.create({
        data: { number: invoiceNumber, type: 'incoming', date: new Date(), supplierId, totalValue: items.reduce((a:number,b:any) => a + b.quantity * b.price, 0), status: 'posted', itemsJSON: JSON.stringify(items) }
    });
    for(const item of items) {
        await prisma.ingredient.update({ where: { id: item.ingredientId }, data: { currentStock: { increment: item.quantity }, costPerUnit: item.price } });
    }
    res.json({ success: true });
});
app.post('/api/inventory/waste', async (req, res) => {
    const { ingredientId, quantity, reason } = req.body;
    await prisma.ingredient.update({ where: { id: ingredientId }, data: { currentStock: { decrement: quantity } } });
    res.json(await prisma.wasteLog.create({ data: { ingredientId, quantity, reason } }));
});
app.get('/api/inventory/waste', async (req, res) => res.json(await prisma.wasteLog.findMany({ orderBy: { date: 'desc' } })));
app.post('/api/inventory/transfer', async (req, res) => res.json(await prisma.stockTransfer.create({ data: req.body })));
app.post('/api/inventory/production', async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const product = await prisma.product.findUnique({ where: { id: productId }, include: { recipe: true } });
        if(product && product.recipe) {
            for(const rItem of product.recipe) {
                await prisma.ingredient.update({ where: { id: rItem.ingredientId }, data: { currentStock: { decrement: rItem.quantity * quantity } } });
            }
            await prisma.auditLog.create({ data: { action: 'PRODUCTION', user: 'Kitchen', details: `Produced ${quantity}x ${product.name}`, timestamp: Date.now() } });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Recipe not found" });
        }
    } catch (e) {
        res.status(500).json({ error: "Production failed" });
    }
});

// STAFF
app.get('/api/users', async (req, res) => res.json((await prisma.user.findMany()).map(u => ({...u, skills: u.skills ? JSON.parse(u.skills) : []}))));
app.post('/api/users', async (req, res) => res.json(await prisma.user.create({ data: req.body })));
app.put('/api/users/:id', async (req, res) => res.json(await prisma.user.update({ where: { id: req.params.id }, data: req.body })));
app.post('/api/shifts/start', async (req, res) => res.json(await prisma.shift.create({ data: { userId: req.body.userId, startTime: new Date() } })));
app.post('/api/shifts/end', async (req, res) => res.json(await prisma.shift.update({ where: { id: req.body.shiftId }, data: { endTime: new Date() } })));
app.get('/api/shifts', async (req, res) => res.json(await prisma.shift.findMany({ orderBy: { startTime: 'desc' }, take: 100 })));
app.get('/api/training/quizzes', async (req, res) => res.json(await prisma.quizResult.findMany()));
app.post('/api/training/quizzes', async (req, res) => res.json(await prisma.quizResult.create({ data: req.body })));

// FINANCE
app.get('/api/finance/transactions', async (req, res) => res.json(await prisma.cashTransaction.findMany({ orderBy: { timestamp: 'desc' } })));
app.post('/api/finance/transactions', async (req, res) => res.json(await prisma.cashTransaction.create({ data: req.body })));
app.get('/api/finance/zreports', async (req, res) => res.json(await prisma.zReport.findMany({ orderBy: { id: 'desc' } })));
app.post('/api/finance/zreports', async (req, res) => res.json(await prisma.zReport.create({ data: req.body })));
app.get('/api/invoices', async (req, res) => res.json((await prisma.invoice.findMany({ orderBy: { date: 'desc' } })).map(i => ({...i, items: JSON.parse(i.itemsJSON)}))));
app.post('/api/invoices', async (req, res) => {
    const { items, ...rest } = req.body;
    res.json(await prisma.invoice.create({ data: { ...rest, itemsJSON: JSON.stringify(items) } }));
});

// OPS
app.get('/api/notifications', async (req, res) => res.json(await prisma.systemNotification.findMany({ orderBy: { timestamp: 'desc' }, take: 50 })));
app.post('/api/notifications', async (req, res) => res.json(await prisma.systemNotification.create({ data: req.body })));
app.get('/api/audit', async (req, res) => res.json(await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 })));
app.get('/api/chat', async (req, res) => res.json(await prisma.chatMessage.findMany({ orderBy: { timestamp: 'asc' }, take: 100 })));
app.post('/api/chat', async (req, res) => {
    const msg = await prisma.chatMessage.create({ data: req.body });
    io.emit('new_message', msg);
    res.json(msg);
});
app.get('/api/logbook', async (req, res) => res.json((await prisma.logbookEntry.findMany({ orderBy: { date: 'desc' }, take: 30 })).map(l => ({...l, checklist: l.checklist ? JSON.parse(l.checklist) : []}))));
app.post('/api/logbook', async (req, res) => {
    const { checklist, ...rest } = req.body;
    res.json(await prisma.logbookEntry.create({ data: { ...rest, checklist: JSON.stringify(checklist) } }));
});

// CRM & MARKETING
app.get('/api/marketing/vouchers', async (req, res) => res.json(await prisma.voucher.findMany()));
app.post('/api/marketing/vouchers', async (req, res) => res.json(await prisma.voucher.create({ data: req.body })));
app.get('/api/marketing/promos', async (req, res) => res.json(await prisma.promotion.findMany()));
app.post('/api/marketing/promos', async (req, res) => res.json(await prisma.promotion.create({ data: req.body })));
app.get('/api/crm/clients', async (req, res) => res.json((await prisma.client.findMany()).map(c => ({...c, tags: c.tags ? JSON.parse(c.tags) : []}))));
app.get('/api/reservations', async (req, res) => res.json(await prisma.reservation.findMany()));
app.post('/api/reservations', async (req, res) => res.json(await prisma.reservation.create({ data: req.body })));
app.put('/api/reservations/:id', async (req, res) => res.json(await prisma.reservation.update({ where: { id: req.params.id }, data: req.body })));

// SERVE FRONTEND (Production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
