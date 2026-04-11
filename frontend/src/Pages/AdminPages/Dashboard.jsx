import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  MdPeople,
  MdSchool,
  MdPayments,
  MdSupportAgent,
  MdArrowUpward,
  MdArrowForward,
  MdRefresh,
  MdPerson,
  MdCheckCircle,
  MdPendingActions,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { showError } from '../../utils/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusTone = (status = '') => {
  const normalized = status.toLowerCase();

  if (normalized === 'resolved' || normalized === 'completed') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
  }

  if (normalized === 'open' || normalized === 'pending' || normalized === 'in progress') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
  }

  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    users: [],
    courses: [],
    plans: [],
    tickets: [],
    loans: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [usersRes, coursesRes, plansRes, ticketsRes, loansRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/courses/with-details`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/support-tickets`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/loans/admin`, { headers: getAuthHeaders() }),
      ]);

      setDashboardData({
        users: usersRes?.data?.users || [],
        courses: coursesRes?.data?.courses || [],
        plans: plansRes?.data?.plans || [],
        tickets: ticketsRes?.data?.data || [],
        loans: loansRes?.data?.loans || [],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const { users, courses, plans, tickets, loans } = dashboardData;

    const farmers = users.filter((user) => user.role === 'farmer').length;
    const activeUsers = users.filter((user) => user.isActive !== false).length;

    const publishedCourses = courses.filter((course) => course.isPublished).length;
    const activePlans = plans.filter((plan) => plan.isActive).length;

    const openTickets = tickets.filter((ticket) => {
      const status = (ticket.status || '').toLowerCase();
      return status === 'open' || status === 'in progress';
    }).length;
    const resolvedTickets = tickets.filter((ticket) => {
      const status = (ticket.status || '').toLowerCase();
      return status === 'resolved' || status === 'closed';
    }).length;

    const activeLoans = loans.filter((loan) => (loan.status || '').toLowerCase() === 'active').length;
    const completedLoans = loans.filter((loan) => (loan.status || '').toLowerCase() === 'completed').length;
    const overdueLoans = loans.filter((loan) => {
      const status = (loan.status || '').toLowerCase();
      const arrearsAmount = Number(loan.arrearsAmount || 0);
      const dueDate = loan.nextDueDate ? new Date(loan.nextDueDate) : null;
      const isPastDue = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate < new Date() : false;
      return status === 'active' && (arrearsAmount > 0 || isPastDue);
    }).length;

    const totalLoanValue = loans.reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
    const outstandingLoanValue = loans.reduce((sum, loan) => sum + Number(loan.remainingBalance || 0), 0);

    return {
      totalUsers: users.length,
      farmers,
      activeUsers,
      totalCourses: courses.length,
      publishedCourses,
      totalPlans: plans.length,
      activePlans,
      totalTickets: tickets.length,
      openTickets,
      resolvedTickets,
      totalLoans: loans.length,
      activeLoans,
      completedLoans,
      overdueLoans,
      totalLoanValue,
      outstandingLoanValue,
      recentTickets: tickets.slice(0, 5),
    };
  }, [dashboardData]);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      subtext: `${stats.farmers} farmers`,
      icon: MdPeople,
      action: () => navigate('/admin/users'),
    },
    {
      label: 'Published Courses',
      value: stats.publishedCourses,
      subtext: `${stats.totalCourses} total courses`,
      icon: MdSchool,
      action: () => navigate('/admin/courses'),
    },
    {
      label: 'Active Loan Plans',
      value: stats.activePlans,
      subtext: `${stats.totalPlans} configured plans`,
      icon: MdPayments,
      action: () => navigate('/admin/repayments'),
    },
    {
      label: 'Open Tickets',
      value: stats.openTickets,
      subtext: `${stats.totalTickets} total support tickets`,
      icon: MdSupportAgent,
      action: () => navigate('/admin/tickets'),
    },
    {
      label: 'Active Loans',
      value: stats.activeLoans,
      subtext: `${stats.totalLoans} total loans`,
      icon: MdPayments,
      action: () => navigate('/admin/loan-repayments'),
    },
    {
      label: 'Overdue Loans',
      value: stats.overdueLoans,
      subtext: `${stats.completedLoans} completed loans`,
      icon: MdPendingActions,
      action: () => navigate('/admin/loan-repayments'),
    },
  ];

  return (
    <div className="p-4 md:p-5 lg:p-6 bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-3 pb-3">
        <section className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-3.5 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] tracking-tight">
                Admin Dashboard
              </h1>
              <p className="mt-0.5 text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                Real-time overview of users, learning content, loan plans and support activity.
              </p>
            </div>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] md:text-xs font-semibold font-['Sora'] transition-colors"
            >
              <MdRefresh className={loading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <button
                  key={card.label}
                  onClick={card.action}
                  className="text-left rounded-md border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900/60 p-2.5 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-['Sora'] leading-tight uppercase tracking-wide">
                        {card.label}
                      </p>
                      <p className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora'] leading-none">
                        {loading ? '...' : card.value}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] leading-tight">
                        {card.subtext}
                      </p>
                    </div>

                    <Icon className="text-lg text-slate-500 dark:text-slate-300 shrink-0" />
                  </div>

                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-['Sora']">
                    View details
                    <MdArrowForward className="text-xs" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="xl:col-span-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-3.5 md:p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                Support Activity
              </h2>
              <button
                onClick={() => navigate('/admin/tickets')}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline font-['Sora']"
              >
                Go to Tickets
              </button>
            </div>

            <div className="mt-2.5 space-y-2">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                </div>
              )}

              {!loading && stats.recentTickets.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-300 dark:border-slate-600 p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                    No support tickets yet.
                  </p>
                </div>
              )}

              {!loading &&
                stats.recentTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate font-['Sora']">
                          {ticket.subject || 'Untitled request'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">
                          {ticket.userId?.name || 'Unknown user'} • {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap font-['Sora'] ${getStatusTone(ticket.status)}`}
                      >
                        {ticket.status || 'Open'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-3.5 md:p-4">
            <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
              Quick Health
            </h2>

            <div className="mt-2.5 space-y-2">
              <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/80 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">Active accounts</p>
                  <MdPerson className="text-sm text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
                  {loading ? '...' : stats.activeUsers}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/80 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">Resolved tickets</p>
                  <MdCheckCircle className="text-sm text-emerald-500" />
                </div>
                <p className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
                  {loading ? '...' : stats.resolvedTickets}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/80 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">Items needing action</p>
                  <MdPendingActions className="text-sm text-amber-500" />
                </div>
                <p className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
                  {loading ? '...' : stats.openTickets}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/80 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">Total loan value</p>
                  <MdPayments className="text-sm text-indigo-500" />
                </div>
                <p className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
                  {loading ? '...' : `LKR ${Math.round(stats.totalLoanValue).toLocaleString()}`}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/80 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">Outstanding balance</p>
                  <MdArrowUpward className="text-sm text-rose-500" />
                </div>
                <p className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
                  {loading ? '...' : `LKR ${Math.round(stats.outstandingLoanValue).toLocaleString()}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/loan-repayments')}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-1.5 px-2.5 text-[11px] md:text-xs font-semibold font-['Sora'] transition-colors"
            >
              Manage Loans
              <MdArrowUpward className="rotate-45 text-xs" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;