
import { 
    Order, MenuItem, Ingredient, User, Shift, Reservation, Client, Voucher, Promotion, 
    CateringEvent, LogbookEntry, ChatMessage, HaccpLog, Settings, Table, StockTransfer,
    CashTransaction, ZReport, Asset, LaundryItem, CoatCheckTicket, LostItem, GiftCard, SystemNotification,
    QuizResult, WaitlistEntry, Feedback, WasteLog, AuditLog, MenuSchedule, Skill, Invoice, Supplier,
    MaintenanceLog, CleaningTask, BackupJob
} from '../types';

const API_URL = 'http://localhost:3000/api';
const headers = { 'Content-Type': 'application/json' };

export const ApiService = {
    // --- SYSTEM & SETUP ---
    async getSettings(): Promise<Settings> {
        return fetch(`${API_URL}/settings`).then(r => r.json());
    },
    async saveSettings(settings: Settings): Promise<Settings> {
        return fetch(`${API_URL}/settings`, { method: 'POST', headers, body: JSON.stringify(settings) }).then(r => r.json());
    },
    async seedData(): Promise<void> {
        await fetch(`${API_URL}/seed`, { method: 'POST' });
    },
    
    // --- CORE ---
    async getTables(): Promise<Table[]> {
        return fetch(`${API_URL}/tables`).then(r => r.json());
    },
    async saveTables(tables: Table[]): Promise<void> {
        await fetch(`${API_URL}/tables`, { method: 'POST', headers, body: JSON.stringify(tables) });
    },
    async getMenu(): Promise<MenuItem[]> {
        return fetch(`${API_URL}/menu`).then(r => r.json());
    },
    async saveMenuItem(item: MenuItem): Promise<MenuItem> {
        return fetch(`${API_URL}/menu`, { method: 'POST', headers, body: JSON.stringify(item) }).then(r => r.json());
    },
    async getMenuSchedules(): Promise<MenuSchedule[]> {
        return fetch(`${API_URL}/menu/schedules`).then(r => r.json());
    },
    async addMenuSchedule(schedule: MenuSchedule): Promise<MenuSchedule> {
        return fetch(`${API_URL}/menu/schedules`, { method: 'POST', headers, body: JSON.stringify(schedule) }).then(r => r.json());
    },

    // --- POS & ORDERS ---
    async getOrders(): Promise<Order[]> {
        return fetch(`${API_URL}/orders`).then(r => r.json());
    },
    async getArchivedOrders(): Promise<Order[]> {
        return fetch(`${API_URL}/archive`).then(r => r.json());
    },
    async placeOrder(orderData: any): Promise<Order> {
        return fetch(`${API_URL}/orders`, { method: 'POST', headers, body: JSON.stringify(orderData) }).then(r => r.json());
    },
    async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
        return fetch(`${API_URL}/orders/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async updateOrderStatus(id: string, status: string): Promise<Order> {
        return fetch(`${API_URL}/orders/${id}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) }).then(r => r.json());
    },
    async updateOrderItemStatus(orderId: string, itemId: string, status: string): Promise<void> {
        await fetch(`${API_URL}/orders/${orderId}/items/${itemId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    },
    async voidOrderItem(orderId: string, itemIdx: number, reason: string, returnStock: boolean, user: string): Promise<void> {
        await fetch(`${API_URL}/orders/${orderId}/void`, { method: 'POST', headers, body: JSON.stringify({ itemIdx, reason, returnStock, user }) });
    },
    async transferTable(fromTableId: number, toTableId: number, user: string): Promise<void> {
        await fetch(`${API_URL}/orders/transfer`, { method: 'POST', headers, body: JSON.stringify({ fromTableId, toTableId, user }) });
    },

    // --- INVENTORY & INVOICES ---
    async getInventory(): Promise<Ingredient[]> {
        return fetch(`${API_URL}/inventory`).then(r => r.json());
    },
    async getSuppliers(): Promise<Supplier[]> {
        return fetch(`${API_URL}/suppliers`).then(r => r.json());
    },
    async addSupplier(data: Supplier): Promise<Supplier> {
        return fetch(`${API_URL}/suppliers`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getInvoices(): Promise<Invoice[]> {
        return fetch(`${API_URL}/invoices`).then(r => r.json());
    },
    async createInvoice(data: Invoice): Promise<Invoice> {
        return fetch(`${API_URL}/invoices`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getWasteLogs(): Promise<WasteLog[]> {
        return fetch(`${API_URL}/inventory/waste`).then(r => r.json());
    },
    async processNIR(data: any): Promise<any> {
        return fetch(`${API_URL}/inventory/nir`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async logWaste(data: any): Promise<any> {
        return fetch(`${API_URL}/inventory/waste`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async addTransfer(data: StockTransfer): Promise<StockTransfer> {
        return fetch(`${API_URL}/inventory/transfer`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async processBatchProduction(productId: string, quantity: number): Promise<void> {
        await fetch(`${API_URL}/inventory/production`, { method: 'POST', headers, body: JSON.stringify({ productId, quantity }) });
    },

    // --- STAFF ---
    async getUsers(): Promise<User[]> {
        return fetch(`${API_URL}/users`).then(r => r.json());
    },
    async createUser(data: User): Promise<User> {
        return fetch(`${API_URL}/users`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async updateUser(id: string, data: Partial<User>): Promise<User> {
        return fetch(`${API_URL}/users/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async startShift(userId: string): Promise<Shift> {
        return fetch(`${API_URL}/shifts/start`, { method: 'POST', headers, body: JSON.stringify({ userId }) }).then(r => r.json());
    },
    async endShift(shiftId: string): Promise<Shift> {
        return fetch(`${API_URL}/shifts/end`, { method: 'POST', headers, body: JSON.stringify({ shiftId }) }).then(r => r.json());
    },
    async getShifts(): Promise<Shift[]> {
        return fetch(`${API_URL}/shifts`).then(r => r.ok ? r.json() : []);
    },
    async saveQuizResult(data: QuizResult): Promise<QuizResult> {
        return fetch(`${API_URL}/training/quizzes`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getQuizResults(): Promise<QuizResult[]> {
        return fetch(`${API_URL}/training/quizzes`).then(r => r.json());
    },
    async getSkills(): Promise<Skill[]> {
        return fetch(`${API_URL}/skills`).then(r => r.json());
    },
    async assignSkill(userId: string, skillId: string): Promise<void> {
        await fetch(`${API_URL}/users/${userId}/skills`, { method: 'POST', headers, body: JSON.stringify({ skillId }) });
    },

    // --- CRM & FEEDBACK ---
    async getClients(): Promise<Client[]> {
        return fetch(`${API_URL}/clients`).then(r => r.json());
    },
    async getReservations(): Promise<Reservation[]> {
        return fetch(`${API_URL}/reservations`).then(r => r.json());
    },
    async addReservation(resData: Reservation): Promise<Reservation> {
        return fetch(`${API_URL}/reservations`, { method: 'POST', headers, body: JSON.stringify(resData) }).then(r => r.json());
    },
    async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
        return fetch(`${API_URL}/reservations/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getWaitlist(): Promise<WaitlistEntry[]> {
        return fetch(`${API_URL}/waitlist`).then(r => r.json());
    },
    async addToWaitlist(data: WaitlistEntry): Promise<WaitlistEntry> {
        return fetch(`${API_URL}/waitlist`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async updateWaitlistStatus(id: string, status: string): Promise<void> {
        await fetch(`${API_URL}/waitlist/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    },
    async getFeedback(): Promise<Feedback[]> {
        return fetch(`${API_URL}/feedback`).then(r => r.json());
    },
    async addFeedback(data: Feedback): Promise<Feedback> {
        return fetch(`${API_URL}/feedback`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },

    // --- FACILITIES ---
    async getAssets(): Promise<Asset[]> {
        return fetch(`${API_URL}/assets`).then(r => r.json());
    },
    async addAsset(data: Asset): Promise<Asset> {
        return fetch(`${API_URL}/assets`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getLaundryItems(): Promise<LaundryItem[]> {
        return fetch(`${API_URL}/laundry`).then(r => r.json());
    },
    async updateLaundryItem(id: string, updates: Partial<LaundryItem>): Promise<LaundryItem> {
        return fetch(`${API_URL}/laundry/${id}`, { method: 'PUT', headers, body: JSON.stringify(updates) }).then(r => r.json());
    },
    async getCoatCheckTickets(): Promise<CoatCheckTicket[]> {
        return fetch(`${API_URL}/coatcheck`).then(r => r.json());
    },
    async addCoatCheckTicket(data: CoatCheckTicket): Promise<CoatCheckTicket> {
        return fetch(`${API_URL}/coatcheck`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async returnCoatCheckTicket(id: string): Promise<CoatCheckTicket> {
        return fetch(`${API_URL}/coatcheck/${id}/return`, { method: 'PUT', headers }).then(r => r.json());
    },
    async getLostItems(): Promise<LostItem[]> {
        return fetch(`${API_URL}/lostfound`).then(r => r.json());
    },
    async addLostItem(data: LostItem): Promise<LostItem> {
        return fetch(`${API_URL}/lostfound`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async updateLostItem(id: string, updates: Partial<LostItem>): Promise<LostItem> {
        return fetch(`${API_URL}/lostfound/${id}`, { method: 'PUT', headers, body: JSON.stringify(updates) }).then(r => r.json());
    },

    // --- FINANCE ---
    async getCashTransactions(): Promise<CashTransaction[]> {
        return fetch(`${API_URL}/finance/transactions`).then(r => r.json());
    },
    async addCashTransaction(data: CashTransaction): Promise<CashTransaction> {
        return fetch(`${API_URL}/finance/transactions`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getZReports(): Promise<ZReport[]> {
        return fetch(`${API_URL}/finance/zreports`).then(r => r.json());
    },
    async addZReport(data: ZReport): Promise<ZReport> {
        return fetch(`${API_URL}/finance/zreports`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getGiftCards(): Promise<GiftCard[]> {
        return fetch(`${API_URL}/giftcards`).then(r => r.json());
    },
    async addGiftCard(data: GiftCard): Promise<GiftCard> {
        return fetch(`${API_URL}/giftcards`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },

    // --- MARKETING & EVENTS ---
    async getVouchers(): Promise<Voucher[]> {
        return fetch(`${API_URL}/marketing/vouchers`).then(r => r.json());
    },
    async createVoucher(data: Voucher): Promise<Voucher> {
        return fetch(`${API_URL}/marketing/vouchers`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getPromotions(): Promise<Promotion[]> {
        return fetch(`${API_URL}/marketing/promos`).then(r => r.json());
    },
    async createPromotion(data: Promotion): Promise<Promotion> {
        return fetch(`${API_URL}/marketing/promos`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getEvents(): Promise<CateringEvent[]> {
        return fetch(`${API_URL}/events`).then(r => r.json());
    },
    async createEvent(data: CateringEvent): Promise<CateringEvent> {
        return fetch(`${API_URL}/events`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async updateEvent(id: string, data: Partial<CateringEvent>): Promise<CateringEvent> {
        return fetch(`${API_URL}/events/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) }).then(r => r.json());
    },

    // --- OPS & BACKUP ---
    async getBackups(): Promise<BackupJob[]> {
        // Simulated
        return [];
    },
    async createBackup(): Promise<void> {
        // Simulated trigger
        console.log("Backup triggered on server");
    },
    async getLogbook(): Promise<LogbookEntry[]> {
        return fetch(`${API_URL}/logbook`).then(r => r.json());
    },
    async addLogbookEntry(data: LogbookEntry): Promise<LogbookEntry> {
        return fetch(`${API_URL}/logbook`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getNotifications(): Promise<SystemNotification[]> {
        return fetch(`${API_URL}/notifications`).then(r => r.json());
    },
    async getChatHistory(): Promise<ChatMessage[]> {
        return fetch(`${API_URL}/chat`).then(r => r.json());
    },
    async sendMessage(data: ChatMessage): Promise<ChatMessage> {
        return fetch(`${API_URL}/chat`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getAuditLogs(): Promise<AuditLog[]> {
        return fetch(`${API_URL}/audit`).then(r => r.json());
    },
    // Compliance
    async getHaccpLogs(): Promise<HaccpLog[]> {
        return fetch(`${API_URL}/haccp`).then(r => r.json());
    },
    async addHaccpLog(data: HaccpLog): Promise<HaccpLog> {
        return fetch(`${API_URL}/haccp`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
        return fetch(`${API_URL}/maintenance`).then(r => r.json());
    },
    async addMaintenanceLog(data: MaintenanceLog): Promise<MaintenanceLog> {
        return fetch(`${API_URL}/maintenance`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
    },
    async getCleaningTasks(): Promise<CleaningTask[]> {
        return fetch(`${API_URL}/cleaning`).then(r => r.json());
    },
    async completeCleaningTask(id: string, user: string): Promise<CleaningTask> {
        return fetch(`${API_URL}/cleaning/${id}`, { 
            method: 'PUT', 
            headers, 
            body: JSON.stringify({ completed: true, completedAt: new Date(), completedBy: user }) 
        }).then(r => r.json());
    }
};
