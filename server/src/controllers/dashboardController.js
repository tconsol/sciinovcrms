const Client = require('../models/Client');
const Payment = require('../models/Payment');
const FollowUp = require('../models/FollowUp');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalClients,
      paidClients,
      registeredClients,
      declinedClients,
      nextEditionClients,
      totalRevenue,
      pendingFollowUps,
      overdueFollowUps,
      recentActivity,
      clientsByRole,
      recentClients,
    ] = await Promise.all([
      Client.countDocuments({ isDeleted: false }),
      Client.countDocuments({ isDeleted: false, status: 'PAID' }),
      Client.countDocuments({ isDeleted: false, status: 'REGISTERED' }),
      Client.countDocuments({ isDeleted: false, status: 'DECLINED' }),
      Client.countDocuments({ isDeleted: false, status: 'NEXT_EDITION_INTEREST' }),
      Payment.aggregate([
        {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client',
          },
        },
        { $unwind: '$client' },
        { $match: { 'client.isDeleted': false } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      FollowUp.countDocuments({ status: 'PENDING' }),
      FollowUp.countDocuments({
        status: 'PENDING',
        followUpDate: { $lt: new Date() },
      }),
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('clientId', 'fullName'),
      Client.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Client.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName email role status createdAt'),
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    const conversionRate =
      totalClients > 0 ? ((paidClients / totalClients) * 100).toFixed(1) : 0;

    res.json({
      stats: {
        totalClients,
        paidClients,
        registeredClients,
        declinedClients,
        nextEditionClients,
        totalRevenue: revenue,
        conversionRate: parseFloat(conversionRate),
        pendingFollowUps,
        overdueFollowUps,
      },
      clientsByRole,
      recentActivity,
      recentClients,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
