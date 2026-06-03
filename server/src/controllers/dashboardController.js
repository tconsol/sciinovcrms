const Client = require('../models/Client');
const Payment = require('../models/Payment');
const FollowUp = require('../models/FollowUp');
const ActivityLog = require('../models/ActivityLog');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86400000);
    const weekStart  = new Date(todayStart.getTime() - 6 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);
    const last12Start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const last5YearStart = new Date(now.getFullYear() - 4, 0, 1);

    const [
      totalClients, paidClients, totalRevenue,
      pendingFollowUps, overdueFollowUps,
      recentActivity, clientsByRole, clientsByStatus, recentClients,
      // today
      todayClients, todayPaymentsAgg, todayConversations,
      // week
      weekRevenue, weekConversations,
      // month
      monthClients, monthRevenue, monthConversations,
      // year
      yearRevenue, yearConversations,
      // charts
      monthlyRevenue, monthlyConversations, dailyRevenue,
      yearlyRevenue,
      weeklyRevenue, weeklyConversations, monthlyConvDay,
      // by admin
      convsByAdmin, paymentsByAdmin,
    ] = await Promise.all([
      Client.countDocuments({ isDeleted: false }),
      Client.countDocuments({ isDeleted: false, status: 'PAID' }),
      Payment.aggregate([
        { $lookup: { from: 'clients', localField: 'clientId', foreignField: '_id', as: 'client' } },
        { $unwind: '$client' },
        { $match: { 'client.isDeleted': false } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      FollowUp.countDocuments({ status: 'PENDING' }),
      FollowUp.countDocuments({ status: 'PENDING', followUpDate: { $lt: now } }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('clientId', 'fullName'),
      Client.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
      Client.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Client.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('fullName email role status createdAt'),
      // today
      Client.countDocuments({ isDeleted: false, createdAt: { $gte: todayStart, $lt: todayEnd } }),
      Payment.aggregate([{ $match: { paymentDate: { $gte: todayStart, $lt: todayEnd } } }, { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } }]),
      FollowUp.countDocuments({ createdAt: { $gte: todayStart, $lt: todayEnd } }),
      // week
      Payment.aggregate([{ $match: { paymentDate: { $gte: weekStart } } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      FollowUp.countDocuments({ createdAt: { $gte: weekStart } }),
      // month
      Client.countDocuments({ isDeleted: false, createdAt: { $gte: monthStart } }),
      Payment.aggregate([{ $match: { paymentDate: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      FollowUp.countDocuments({ createdAt: { $gte: monthStart } }),
      // year
      Payment.aggregate([{ $match: { paymentDate: { $gte: yearStart } } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      FollowUp.countDocuments({ createdAt: { $gte: yearStart } }),
      // monthly revenue last 12
      Payment.aggregate([
        { $match: { paymentDate: { $gte: last12Start } } },
        { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } }, revenue: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // monthly conversations last 12
      FollowUp.aggregate([
        { $match: { createdAt: { $gte: last12Start } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // daily revenue current month
      Payment.aggregate([
        { $match: { paymentDate: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' }, day: { $dayOfMonth: '$paymentDate' } }, revenue: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      // yearly revenue last 5 years
      Payment.aggregate([
        { $match: { paymentDate: { $gte: last5YearStart } } },
        { $group: { _id: { year: { $year: '$paymentDate' } }, revenue: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1 } },
      ]),
      // weekly daily revenue (last 7 days)
      Payment.aggregate([
        { $match: { paymentDate: { $gte: weekStart } } },
        { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' }, day: { $dayOfMonth: '$paymentDate' } }, revenue: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      // weekly daily conversations (last 7 days)
      FollowUp.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      // monthly conversations current month
      FollowUp.aggregate([
        { $match: { createdAt: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: { day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.day': 1 } },
      ]),
      // conversations by admin (all time)
      FollowUp.aggregate([
        { $group: { _id: '$createdBy', count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      // payments by admin (all time)
      Payment.aggregate([
        { $group: { _id: '$createdBy', total: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    // Build monthly chart (revenue + conversations combined)
    const monthRevMap = {}, monthConvMap = {};
    monthlyRevenue.forEach((m) => { monthRevMap[`${m._id.year}-${m._id.month}`] = { revenue: m.revenue, count: m.count }; });
    monthlyConversations.forEach((m) => { monthConvMap[`${m._id.year}-${m._id.month}`] = m.count; });
    const monthlyChart = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyChart.push({
        month: MONTHS[d.getMonth()],
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        revenue: monthRevMap[key]?.revenue || 0,
        payments: monthRevMap[key]?.count || 0,
        conversations: monthConvMap[key] || 0,
      });
    }

    // Daily chart current month (with conversations)
    const dailyRevMap = {}, dailyConvMap = {};
    dailyRevenue.forEach((d) => { dailyRevMap[`${d._id.day}`] = { revenue: d.revenue, count: d.count }; });
    monthlyConvDay.forEach((d) => { dailyConvMap[`${d._id.day}`] = d.count; });
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyChart = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dailyChart.push({
        day: `${day}`,
        revenue: dailyRevMap[`${day}`]?.revenue || 0,
        payments: dailyRevMap[`${day}`]?.count || 0,
        conversations: dailyConvMap[`${day}`] || 0,
      });
    }

    // Weekly chart last 7 days
    const wRevMap = {}, wConvMap = {};
    weeklyRevenue.forEach((d) => { wRevMap[`${d._id.year}-${d._id.month}-${d._id.day}`] = { revenue: d.revenue, count: d.count }; });
    weeklyConversations.forEach((d) => { wConvMap[`${d._id.year}-${d._id.month}-${d._id.day}`] = d.count; });
    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 86400000);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      weeklyChart.push({
        day: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        revenue: wRevMap[key]?.revenue || 0,
        payments: wRevMap[key]?.count || 0,
        conversations: wConvMap[key] || 0,
      });
    }

    // Yearly chart last 5 years
    const yearlyMap = {};
    yearlyRevenue.forEach((y) => { yearlyMap[y._id.year] = { revenue: y.revenue, count: y.count }; });
    const yearlyChart = [];
    for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
      yearlyChart.push({ year: `${y}`, revenue: yearlyMap[y]?.revenue || 0, payments: yearlyMap[y]?.count || 0 });
    }

    res.json({
      stats: {
        totalClients, paidClients,
        totalRevenue: totalRevenue[0]?.total || 0,
        conversionRate: parseFloat(totalClients > 0 ? ((paidClients / totalClients) * 100).toFixed(1) : 0),
        pendingFollowUps, overdueFollowUps,
        todayClients,
        todayRevenue: todayPaymentsAgg[0]?.total || 0,
        todayPayments: todayPaymentsAgg[0]?.count || 0,
        todayConversations,
        weekRevenue: weekRevenue[0]?.total || 0,
        weekConversations,
        monthClients,
        monthRevenue: monthRevenue[0]?.total || 0,
        monthConversations,
        yearRevenue: yearRevenue[0]?.total || 0,
        yearConversations,
      },
      clientsByRole, clientsByStatus,
      weeklyChart, monthlyChart, dailyChart, yearlyChart,
      convsByAdmin, paymentsByAdmin,
      recentActivity, recentClients,
    });
  } catch (error) {
    console.error('[Dashboard Error]', error);
    res.status(500).json({ message: error.message });
  }
};

// Custom date range analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'from and to required' });
    const start = new Date(from);
    const end = new Date(new Date(to).getTime() + 86400000);

    const [revenue, convCount, clients, convsByAdmin, paysByAdmin, dailyRev, dailyConv] = await Promise.all([
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
      ]),
      FollowUp.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Client.countDocuments({ isDeleted: false, createdAt: { $gte: start, $lt: end } }),
      FollowUp.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: '$createdBy', count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lt: end } } },
        { $group: { _id: '$createdBy', total: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lt: end } } },
        { $group: { _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' }, d: { $dayOfMonth: '$paymentDate' } }, revenue: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
      ]),
      FollowUp.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
      ]),
    ]);

    // Build daily chart for range
    const revMap = {}, convMap = {};
    dailyRev.forEach((d) => { revMap[`${d._id.y}-${d._id.m}-${d._id.d}`] = { revenue: d.revenue, count: d.count }; });
    dailyConv.forEach((d) => { convMap[`${d._id.y}-${d._id.m}-${d._id.d}`] = d.count; });
    const MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const chart = [];
    for (let d = new Date(start); d < end; d = new Date(d.getTime() + 86400000)) {
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      chart.push({
        day: `${d.getDate()} ${MS[d.getMonth()]}`,
        revenue: revMap[key]?.revenue || 0,
        conversations: convMap[key] || 0,
      });
    }

    res.json({
      revenue: revenue[0]?.total || 0,
      paymentCount: revenue[0]?.count || 0,
      conversations: convCount,
      clients,
      convsByAdmin,
      paysByAdmin,
      chart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
