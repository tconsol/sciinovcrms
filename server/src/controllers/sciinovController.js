const axios = require('axios');
const config = require('../config');

exports.getConferences = async (req, res) => {
  try {
    const response = await axios.get(`${config.sciinovBaseUrl}/api/conferences`, {
      headers: { Authorization: `Bearer ${req.user.token}` },
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to fetch conferences';
    res.status(status).json({ message });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const response = await axios.get(`${config.sciinovBaseUrl}/api/dashboard-data`, {
      headers: { Authorization: `Bearer ${req.user.token}` },
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to fetch dashboard data';
    res.status(status).json({ message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const response = await axios.get(`${config.sciinovBaseUrl}/api/export/excel`, {
      headers: { Authorization: `Bearer ${req.user.token}` },
      responseType: 'arraybuffer',
    });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=export.xlsx',
    });
    res.send(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ message: 'Failed to export Excel' });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    const response = await axios.get(`${config.sciinovBaseUrl}/api/export/pdf`, {
      headers: { Authorization: `Bearer ${req.user.token}` },
      responseType: 'arraybuffer',
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=export.pdf',
    });
    res.send(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ message: 'Failed to export PDF' });
  }
};
