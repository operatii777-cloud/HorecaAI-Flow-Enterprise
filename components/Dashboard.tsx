
import React, { useMemo, useState, useEffect } from 'react';
import { Order, OrderStatus, Ingredient } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Users, ShoppingBag, AlertTriangle, Utensils, Star, Smile, AlertOctagon, CheckCircle, Award, Crown, Target, ArrowUp } from 'lucide-react';
import { ApiService } from '../services/api';

interface DashboardProps {
  orders: Order[];
}

export const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [rating, setRating] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(5000);

  useEffect(() => {
      const fetchData = async () => {
          const [ing, feedbacks, settings] = await Promise.all([
              ApiService.getInventory(),
              ApiService.getFeedback(),
              ApiService.getSettings()
          ]);
          setIngredients(ing);
          if(feedbacks.length > 0) {
              setRating(feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length);
          }
          if(settings.dailySalesTarget) setDailyTarget(settings.dailySalesTarget);
      };
      fetchData();
  }, []);

  const paidOrders = orders.filter(o => o.status === OrderStatus.PAID);
  const totalRevenue = paidOrders.reduce((acc, order) => acc + order.total, 0);
  const targetProgress = Math.min((totalRevenue / dailyTarget) * 100, 100);
  const lowStockItems = ingredients.filter(i => i.currentStock <= i.minStockAlert);

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 rounded-full bg-emerald-100 text-emerald-600"><DollarSign size={24}/></div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase">Venituri Totale</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalRevenue.toFixed(0)} RON</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600"><Smile size={24}/></div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase">Satisfactie</p>
                <h3 className="text-2xl font-bold text-slate-800">{rating > 0 ? rating.toFixed(1) : '-'}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 rounded-full bg-orange-100 text-orange-600"><AlertTriangle size={24}/></div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase">Stoc Critic</p>
                <h3 className="text-2xl font-bold text-slate-800">{lowStockItems.length}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 rounded-full bg-indigo-100 text-indigo-600"><Target size={24}/></div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase">Target Zilnic</p>
                <h3 className="text-2xl font-bold text-slate-800">{targetProgress.toFixed(0)}%</h3>
            </div>
        </div>
      </div>
      
      {/* Charts Omitted for brevity but logic is now data-driven via props */}
    </div>
  );
};
