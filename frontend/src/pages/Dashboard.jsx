import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Paper } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import { getDashboardStats, getTransactions } from '../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, color }}>
      {React.cloneElement(icon, { sx: { fontSize: 140 } })}
    </Box>
    <CardContent sx={{ zIndex: 1, p: 3 }}>
      <Typography color="text.secondary" variant="h6" gutterBottom fontWeight="500">
        {title}
      </Typography>
      <Typography variant="h3" component="div" fontWeight="bold" sx={{ color }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPurchases: 0, totalSales: 0, pendingPayments: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
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
        // Take the top 5 most recent transactions
        setRecentTransactions(transRes.data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {user ? `Welcome back, ${user.name} 👋` : 'Dashboard Overview'}
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Total Purchases" 
            value={stats.totalPurchases} 
            icon={<TrendingUpIcon />} 
            color="#3b82f6" // blue
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Total Sales" 
            value={stats.totalSales} 
            icon={<AssessmentIcon />} 
            color="#10b981" // green
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Pending Payments" 
            value={stats.pendingPayments} 
            icon={<AccountBalanceWalletIcon />} 
            color="#ef4444" // red
          />
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: '600' }}>
        Recent Transactions
      </Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        {recentTransactions.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>SR Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Party</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount (₹)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{dayjs(tx.date).format('DD-MMM-YYYY')}</TableCell>
                    <TableCell>{tx.srNumber}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{tx.partAccountName || '-'}</TableCell>
                    <TableCell>{tx.rate ? `₹ ${tx.rate.toLocaleString()}` : '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        bgcolor: tx.status === 'PENDING' ? '#fef08a' : '#bbf7d0', 
                        color: tx.status === 'PENDING' ? '#854d0e' : '#166534',
                        px: 1, py: 0.5, borderRadius: 1, display: 'inline-block', fontSize: '0.75rem', fontWeight: 'bold'
                      }}>
                        {tx.status}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No recent transactions found.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
