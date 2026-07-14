import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, Chip 
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import dayjs from 'dayjs';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getDashboardStats, getTransactions } from '../services/api';

// Modern Premium Stat Card Component
const StatCard = ({ title, value, icon, gradient, color }) => (
  <Card sx={{ 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    position: 'relative', 
    overflow: 'hidden',
    borderRadius: 4,
    background: gradient,
    color: '#fff',
    boxShadow: `0 8px 32px 0 rgba(${color}, 0.3)`,
    border: '1px solid rgba(255, 255, 255, 0.18)'
  }}>
    <Box sx={{ position: 'absolute', top: -30, right: -20, opacity: 0.2 }}>
      {React.cloneElement(icon, { sx: { fontSize: 160 } })}
    </Box>
    <CardContent sx={{ zIndex: 1, p: 4 }}>
      <Typography variant="h6" gutterBottom fontWeight="500" sx={{ opacity: 0.9 }}>
        {title}
      </Typography>
      <Typography variant="h3" component="div" fontWeight="bold">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPurchases: 0, totalSales: 0, pendingPayments: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    fetchUser();
    
    const fetchData = async () => {
      try {
        const [statsRes, transRes] = await Promise.all([
          getDashboardStats(),
          getTransactions()
        ]);
        setStats(statsRes.data);
        
        // Take the top 7 most recent transactions for the table
        setRecentTransactions(transRes.data.slice(0, 7));

        // Format data for Recharts (last 10 transactions)
        const formattedChartData = transRes.data.slice(0, 10).reverse().map(t => ({
          name: dayjs(t.date).format('DD MMM'),
          sales: t.type === 'SALES' ? t.amount : 0,
          purchases: t.type === 'PURCHASE' ? t.amount : 0,
        }));
        
        setChartData(formattedChartData);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress size={60} /></Box>;
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1e293b' }}>
            {getGreeting()}, {user?.name || 'User'} <WavingHandIcon sx={{ color: '#fbbf24' }} />
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
            Here is what's happening with your business today.
          </Typography>
        </Box>
      </Box>

      {/* Premium Metric Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={4}>
          <StatCard 
            title="Total Sales" 
            value={stats.totalSales || 0} 
            icon={<TrendingUpIcon />} 
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            color="16, 185, 129"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            title="Total Purchases" 
            value={stats.totalPurchases || 0} 
            icon={<TrendingDownIcon />} 
            gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            color="59, 130, 246"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            title="Pending Payments" 
            value={stats.pendingPayments || 0} 
            icon={<WarningAmberIcon />} 
            gradient="linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
            color="244, 63, 94"
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Recharts Area - Financial Flow */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#334155' }}>
              Financial Flow Overview
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Sales (₹)" />
                  <Area type="monotone" dataKey="purchases" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" name="Purchases (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions Styled Table */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 0, borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#334155' }}>
                Recent Transactions
              </Typography>
            </Box>
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.map((row) => (
                    <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background 0.2s' }}>
                      <TableCell sx={{ color: '#475569' }}>
                        {dayjs(row.date).format('DD MMM, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: row.type === 'SALES' ? '#10b981' : '#3b82f6' }}>
                          {row.type}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="800" sx={{ color: '#1e293b' }}>
                          ₹ {row.amount?.toLocaleString() || '0'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.status} 
                          size="small" 
                          sx={{ 
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            backgroundColor: row.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3',
                            color: row.status === 'COMPLETED' ? '#166534' : '#854d0e'
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
