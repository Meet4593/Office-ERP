import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import PurchaseEntry from './pages/PurchaseEntry';
import SalesEntry from './pages/SalesEntry';
import ServiceEntry from './pages/ServiceEntry';
import MasterData from './pages/MasterData';
import TransactionList from './pages/TransactionList';
import JournalList from './pages/JournalList';
import JournalEntry from './pages/JournalEntry';
import VoucherList from './pages/VoucherList';
import VoucherEntry from './pages/VoucherEntry';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.error && this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={<Signup onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            
            <Route path="purchase" element={<TransactionList type="PURCHASE" title="Purchases List" newRoute="/purchase/new" />} />
            <Route path="purchase/new" element={<PurchaseEntry />} />
            <Route path="purchase/edit/:id" element={<PurchaseEntry />} />
            
            <Route path="sales" element={<TransactionList type="SALE" title="Sales List" newRoute="/sales/new" />} />
            <Route path="sales/new" element={<SalesEntry />} />
            <Route path="sales/edit/:id" element={<SalesEntry />} />
            
            <Route path="services" element={<TransactionList type="SERVICE" title="Services List" newRoute="/services/new" />} />
            <Route path="services/new" element={<ServiceEntry />} />
            <Route path="services/edit/:id" element={<ServiceEntry />} />
            
            <Route path="journal" element={<JournalList />} />
            <Route path="journal/new" element={<JournalEntry />} />
            <Route path="journal/edit/:id" element={<JournalEntry />} />

            <Route path="vouchers" element={<VoucherList />} />
            <Route path="vouchers/new" element={<VoucherEntry />} />
            <Route path="vouchers/edit/:id" element={<VoucherEntry />} />
            
            <Route path="master" element={<MasterData />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
