
export enum OrderStatus {
  PENDING = 'pending',
  COOKING = 'cooking',
  READY_FOOD = 'ready_food', // Kitchen done
  READY_BAR = 'ready_bar',   // Bar done
  SERVED = 'served',
  COMPLETED = 'completed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  DELIVERY_PENDING = 'delivery_pending',
  DELIVERY_IN_TRANSIT = 'delivery_in_transit',
  DELIVERED = 'delivered'
}

export enum ProductCategory {
  FOOD = 'Mancare',
  DRINKS = 'Bauturi',
  DESSERT = 'Desert',
  ALCOHOL = 'Alcool',
  COFFEE = 'Cafea'
}

export enum PaymentMethod {
  CASH = 'Numerar',
  CARD = 'Card',
  VOUCHER = 'Voucher',
  GIFT_CARD = 'Gift Card',
  PROTOCOL = 'Protocol'
}

export enum Department {
  WAITERS = 'Ospatari',
  KITCHEN = 'Bucatarie',
  BAR = 'Bar',
  ADMIN = 'Admin',
  HOST = 'Host'
}

export enum UnitOfMeasure {
  KG = 'kg',
  GR = 'g',
  MG = 'mg',
  L = 'l',
  ML = 'ml',
  CL = 'cl',
  BUC = 'buc',
  PORTIE = 'portie',
  PACHET = 'pachet',
  FELIE = 'felie',
  CUTIE = 'cutie',
  STICLA = 'sticla',
  DOZA = 'doza',
  BORCAN = 'borcan',
  SAC = 'sac',
  BAX = 'bax',
  LINGURA = 'lingura',
  LINGURITA = 'lingurita',
  CM = 'cm'
}

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  WAITER = 'waiter',
  CHEF = 'chef',
  BARTENDER = 'bartender',
  DRIVER = 'driver'
}

export type DeliveryPlatform = 'internal' | 'glovo' | 'tazz' | 'bolt_food' | 'uber_eats';
export type KitchenStation = 'Grill' | 'Pizza' | 'Salad' | 'Fryer' | 'Dessert' | 'Pass' | 'Pasta';

// --- CORE ENTITIES ---

export interface User {
  id: string;
  name: string;
  pin: string; // 4 digit PIN
  role: Role;
  active: boolean;
  currentShiftId?: string; // If clocked in
  tipPoints?: number; // Weight for tip distribution (e.g. 1.0, 0.5)
  skills?: string[]; // IDs of earned skills
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    requiredQuizTopic?: string; // If set, passing this quiz awards the skill
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  ordersCount: number;
  lastOrderDate?: string;
  tags?: string[]; // VIP, Vegan, Late Payer
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  durationHours?: number;
  breaks?: { start: string, end?: string, duration?: number }[];
  isOnBreak?: boolean;
}

export interface LogbookEntry {
    id: string;
    date: string;
    shift: 'Breakfast' | 'Lunch' | 'Dinner';
    managerName: string;
    notes: string;
    issues: string;
    weather: string;
    staffRating: number; // 1-5
    sales: number;
    checklist: {task: string, done: boolean}[];
}

export interface ScheduleItem {
  id: string;
  userId: string;
  userName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday...
  startHour: string; // "09:00"
  endHour: string; // "17:00"
  role: Role;
}

export interface Supplier {
  id: string;
  name: string;
  cui: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string; // e.g., "Carne", "Bauturi"
}

export interface Ingredient {
  id: string;
  name: string;
  unit: UnitOfMeasure;
  costPerUnit: number;
  currentStock: number;
  minStockAlert: number;
  supplierId: string;
  warehouse: 'Kitchen' | 'Bar' | 'General' | 'Depozit Central';
  expiryDate?: string; // For traceability
  batchNumber?: string; // Lot
  allergens?: string[];
  // Nutritional info per unit (usually per 100g/ml if unit is kg/l)
  calories?: number; // kcal
  protein?: number; // g
  carbs?: number; // g
  fats?: number; // g
  priceHistory?: { date: string, price: number }[]; // Price Analysis
}

export interface StockAdjustment {
  id: string;
  ingredientId: string;
  oldStock: number;
  newStock: number;
  variance: number;
  reason: 'inventory_count' | 'correction';
  date: string;
  user: string;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
  lossPercentage?: number; // Waste % during prep
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string; // e.g., "Grad Gatire", "Sosuri"
  minSelection: number; // 1 for required
  maxSelection: number; // 1 for radio, >1 for checkbox
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  subCategory?: string; // e.g. "Pizza", "Pasta"
  description: string;
  pairing?: string; // AI Suggestion
  image?: string;
  recipe?: RecipeItem[]; // Linked ingredients
  instructions?: string[]; // Step-by-step cooking instructions
  modifiers?: ModifierGroup[];
  isVegetarian?: boolean;
  calories?: number;
  macros?: {
      protein: number;
      carbs: number;
      fats: number;
  };
  allergens?: string[];
  active: boolean; // Daily menu toggle
  preparationTime?: number; // minutes
  vatRate?: number; // 9, 19, 5 etc.
  station?: KitchenStation; // Routing logic
}

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
  selectedModifiers?: ModifierOption[];
  originalPrice?: number; // Base price
  discountedPrice?: number; // If happy hour applied
  appliedDiscountName?: string;
  course?: 'course_1' | 'course_2' | 'course_3' | 'course_4'; // Aperitiv, Fel 1, Fel 2, Desert
  itemStatus?: 'pending' | 'cooking' | 'ready' | 'served'; // Granular status
  seatIdx?: number; // Guest 1, Guest 2...
}

export interface Order {
  id: string;
  tableId: number; // If 0 or negative, it's a takeaway/delivery
  type: 'dine_in' | 'takeaway' | 'delivery';
  platform?: DeliveryPlatform;
  externalId?: string; // e.g. #GLV-9923
  clientId?: string;
  deliveryInfo?: {
      customerName: string;
      phone: string;
      address: string;
  };
  waiterId?: string;
  driverId?: string;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: number;
  total: number;
  splitBill?: {
    paidAmount: number;
    remainingAmount: number;
    transactions: { amount: number; method: PaymentMethod }[];
  };
  tip?: number;
  discount?: number;
  // Track status of each course: 'hold' (don't cook yet), 'fire' (cook now), 'served'
  courseStatus?: Record<string, 'hold' | 'fire' | 'served'>;
  proofOfDelivery?: string; // Base64 signature or image
  note?: string;
}

export interface Table {
  id: number;
  zone: 'Interior' | 'Terasă' | 'VIP';
  seats: number;
  occupied: boolean;
  reserved: boolean;
  currentOrderId?: string;
  shape: 'round' | 'square' | 'rectangle';
  x?: number; // For visual map
  y?: number;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  tableId?: number;
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'no-show';
  notes?: string;
  depositAmount?: number; // Avans platit
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  partySize: number;
  addedAt: number; // timestamp
  phone?: string;
  estimatedWaitTime?: number; // minutes
  status: 'waiting' | 'seated' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  from: Department | string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Invoice {
  id: string;
  type: 'incoming' | 'outgoing'; // NIR vs Factura Client
  clientName?: string; // For outgoing
  clientCUI?: string;
  supplierId?: string; // For incoming
  number: string;
  date: string;
  dueDate: string;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  totalValue: number;
  status: 'draft' | 'posted' | 'paid' | 'sent';
}

export interface StockTransfer {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  ingredientId: string;
  quantity: number;
  date: string;
  user: string;
}

export interface WasteLog {
  id: string;
  ingredientId: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'burnt' | 'theft' | 'other';
  date: string;
  cost: number;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: number;
  ip?: string;
}

export interface DataRetentionSettings {
    keepOrdersDays: number;
    keepLogsDays: number;
    keepClientsInactiveDays: number;
}

export interface MenuBoardConfig {
    theme: 'dark' | 'light' | 'midnight';
    rotationSeconds: number;
    showPromo: boolean;
    promoImageUrl?: string;
    tickerMessage: string;
    visibleCategories: ProductCategory[];
    useSchedule?: boolean;
}

export interface MenuSchedule {
    id: string;
    name: string; // "Breakfast"
    startTime: string; // "07:00"
    endTime: string; // "11:00"
    activeDays: number[]; // 0-6
    categories: ProductCategory[];
}

export interface PrinterConfig {
    id: string;
    name: string;
    ip: string;
    type: 'kitchen' | 'bar' | 'receipt' | 'label';
    categories: ProductCategory[]; // What categories route here
}

export interface MediaSettings {
    loginBackground?: string;
    logoUrl?: string;
    kioskScreensaver?: string;
}

export interface SoundSettings {
    enabled: boolean;
    kitchenBell: boolean;
    newOrder: boolean;
    error: boolean;
    volume: number; // 0-1
}

export interface Settings {
  restaurantName: string;
  cui: string;
  address: string;
  vatRate: number;
  serviceCharge: number;
  currency: string;
  printerIp: string;
  allowNegativeStock: boolean; // Inventory Guard
  dailySalesTarget?: number; // New: Business Goal
  trainingMode?: boolean;
  maintenanceMode?: boolean; // New: Maintenance
  setupCompleted?: boolean; // New: Wizard Status
  retention?: DataRetentionSettings;
  menuBoard?: MenuBoardConfig;
  printers?: PrinterConfig[];
  media?: MediaSettings;
  sounds?: SoundSettings;
}

export interface Voucher {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
}

export interface GiftCard {
    id: string;
    code: string;
    initialBalance: number;
    currentBalance: number;
    issuedDate: string;
    expiresAt: string;
    active: boolean;
    purchaserName?: string;
    recipientEmail?: string;
}

export interface LaundryItem {
    id: string;
    name: string;
    type: 'Tablecloth' | 'Napkin' | 'Uniform' | 'Towel';
    totalStock: number;
    cleanStock: number;
    dirtyStock: number;
    atLaundryStock: number;
    costPerWash: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'happy_hour' | 'daily_special';
  discountPercent: number;
  active: boolean;
  startHour?: number;
  endHour?: number;
  days: number[]; // 0 = Sunday, 1 = Monday etc.
}

export interface BackupJob {
  id: string;
  date: string;
  size: string;
  type: 'manual' | 'daily';
  status: 'success' | 'failed';
  url?: string;
}

export interface Feedback {
  id: string;
  orderId?: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: number;
  order?: Order;
}

// --- HACCP & COMPLIANCE ---

export interface HaccpLog {
    id: string;
    equipmentId: string; // e.g. "Fridge 1"
    temperature: number;
    timestamp: number;
    user: string;
    status: 'ok' | 'warning' | 'critical';
}

export interface CleaningTask {
    id: string;
    area: string; // Kitchen, Bar
    task: string; // "Mop Floors"
    frequency: 'daily' | 'weekly';
    completed: boolean;
    completedAt?: number;
    completedBy?: string;
}

export interface MaintenanceLog {
    id: string;
    equipment: string;
    issue: string;
    status: 'reported' | 'in_progress' | 'fixed';
    reportedBy: string;
    date: string;
}

export interface Asset {
    id: string;
    name: string;
    serialNumber: string;
    purchaseDate: string;
    warrantyExpires: string;
    purchasePrice: number;
    status: 'active' | 'repair' | 'broken' | 'retired';
    location: string;
    notes?: string;
}

// --- NOTIFICATIONS ---
export interface SystemNotification {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    category: 'inventory' | 'reservation' | 'haccp' | 'system' | 'hr';
    message: string;
    timestamp: number;
    actionLabel?: string;
    actionLink?: string; // module id
    isRead: boolean;
}

// --- EVENTS & CATERING (BEO) ---
export type EventType = 'Wedding' | 'Corporate' | 'Birthday' | 'PrivateParty' | 'Conference';
export type EventStatus = 'Lead' | 'OfferSent' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';

export interface CateringEvent {
    id: string;
    name: string;
    type: EventType;
    clientName: string;
    clientPhone: string;
    date: string;
    startTime: string;
    endTime: string;
    pax: number;
    budgetPerPax: number;
    totalBudget: number;
    depositPaid: number;
    status: EventStatus;
    notes: string;
    menuSelection?: { itemId: string; quantity: number }[];
    setupDetails?: string; // "Round tables, white linen"
    beoNumber: string; // Banquet Event Order #
}

export interface ZReport {
    id: string;
    date: string;
    time: string;
    totalSales: number;
    systemCash: number;
    systemCard: number;
    declaredCash: number;
    declaredCard: number;
    varianceCash: number;
    varianceCard: number;
}

export interface EODReport {
    id: string;
    date: string;
    openedBy: string;
    closedBy: string;
    systemCash: number;
    declaredCash: number;
    systemCard: number;
    declaredCard: number;
    varianceCash: number;
    varianceCard: number;
    totalSales: number;
    ordersCount: number;
    timestamp: number;
}

// --- CASH MANAGEMENT ---
export interface CashTransaction {
    id: string;
    type: 'drop' | 'payout' | 'float_in' | 'float_out';
    amount: number;
    reason: string;
    user: string;
    timestamp: number;
}

// --- HQ / FRANCHISE ---
export interface LocationStats {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'warning';
    salesToday: number;
    salesTarget: number;
    activeOrders: number;
    staffActive: number;
    alerts: number;
    coordinates: { lat: number; lng: number }; // For map visual
}

// --- TRAINING ---
export interface QuizResult {
    id: string;
    userId: string;
    userName: string;
    score: number; // 0-100
    totalQuestions: number;
    date: string;
    topic: 'Menu Knowledge' | 'Allergens' | 'Procedures';
}

// --- COAT CHECK & LOST FOUND ---
export interface CoatCheckTicket {
    id: string;
    ticketNumber: number;
    type: 'Coat' | 'Bag' | 'Umbrella' | 'Valet Key';
    tableId?: number;
    guestName?: string;
    checkInTime: number;
    checkOutTime?: number;
    status: 'Stored' | 'Returned';
    location?: string; // e.g. "Rack A, Hook 5"
}

export interface LostItem {
    id: string;
    description: string;
    locationFound: string;
    foundBy: string; // Staff Name
    dateFound: string;
    status: 'Found' | 'Claimed' | 'Disposed';
    claimedBy?: string;
    claimDate?: string;
    notes?: string;
}