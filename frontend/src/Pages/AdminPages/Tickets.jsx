import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  MdSupportAgent,
  MdRefresh,
  MdSearch,
  MdFilterList,
  MdCheckCircle,
  MdPendingActions,
  MdConfirmationNumber,
  MdClose,
} from 'react-icons/md';
import { showError, showSuccess } from '../../utils/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ITEMS_PER_PAGE = 8;

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
  const normalized = (status || '').toLowerCase();
  if (normalized === 'resolved' || normalized === 'closed') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
  }
  if (normalized === 'open' || normalized === 'in progress') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

const isPendingStatus = (status) => {
  const s = (status || '').toLowerCase();
  return s === 'open' || s === 'in progress';
};

const isSolvedStatus = (status) => {
  const s = (status || '').toLowerCase();
  return s === 'resolved' || s === 'closed';
};

const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

/** After a ticket is Resolved, status and admin reply cannot be changed */
const isTicketReplyLocked = (status) => (status || '').toLowerCase() === 'resolved';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketModal, setTicketModal] = useState({
    isOpen: false,
    ticket: null,
    status: 'Open',
    adminReply: '',
    saving: false,
  });

  const fetchTickets = async ({ isRefresh = false } = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(`${API_BASE_URL}/support-tickets`, {
        headers: getAuthHeaders(),
      });

      setTickets(response?.data?.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showError('Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((t) => isPendingStatus(t.status)).length;
    const solved = tickets.filter((t) => isSolvedStatus(t.status)).length;
    return { total, pending, solved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const user = ticket.userId;
      const userName = typeof user === 'object' && user?.name ? user.name : '';
      const userEmail = typeof user === 'object' && user?.email ? user.email : '';

      const matchesSearch =
        !normalizedSearch ||
        ticket.subject?.toLowerCase().includes(normalizedSearch) ||
        ticket.description?.toLowerCase().includes(normalizedSearch) ||
        userName.toLowerCase().includes(normalizedSearch) ||
        userEmail.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === 'all' || (ticket.category || '').toLowerCase() === categoryFilter;

      const st = (ticket.status || '').toLowerCase();
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = st === statusFilter.toLowerCase();
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tickets, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));

  const paginatedTickets = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: MdConfirmationNumber },
    { label: 'Pending Tickets', value: stats.pending, icon: MdPendingActions },
    { label: 'Solved Tickets', value: stats.solved, icon: MdCheckCircle },
  ];

  const formatCategory = (cat) => {
    if (!cat) return '—';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const openTicketModal = (ticket) => {
    setTicketModal({
      isOpen: true,
      ticket,
      status: ticket?.status || 'Open',
      adminReply: ticket?.adminReply || '',
      saving: false,
    });
  };

  const closeTicketModal = () => {
    setTicketModal({
      isOpen: false,
      ticket: null,
      status: 'Open',
      adminReply: '',
      saving: false,
    });
  };

  const handleSaveTicket = async () => {
    const ticket = ticketModal.ticket;
    if (!ticket?._id) return;
    if (isTicketReplyLocked(ticket.status)) return;

    const originalStatus = ticket.status || 'Open';
    const originalReply = ticket.adminReply || '';
    const nextStatus = ticketModal.status;
    const nextReply = ticketModal.adminReply;

    if (originalStatus === nextStatus && originalReply === nextReply) {
      closeTicketModal();
      return;
    }

    try {
      setTicketModal((prev) => ({ ...prev, saving: true }));

      if (originalStatus !== nextStatus) {
        await axios.put(
          `${API_BASE_URL}/support-tickets/${ticket._id}/status`,
          { status: nextStatus },
          { headers: getAuthHeaders() }
        );
      }

      if (originalReply !== nextReply) {
        await axios.put(
          `${API_BASE_URL}/support-tickets/${ticket._id}/reply`,
          { adminReply: nextReply },
          { headers: getAuthHeaders() }
        );
      }

      showSuccess('Ticket updated successfully');
      closeTicketModal();
      fetchTickets({ isRefresh: true });
    } catch (error) {
      console.error('Error updating ticket:', error);
      showError(error?.response?.data?.message || 'Failed to update ticket');
      setTicketModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const modalReplyLocked =
    Boolean(ticketModal.isOpen && ticketModal.ticket) &&
    isTicketReplyLocked(ticketModal.ticket?.status);

  return (
    <div className="p-4 md:p-5 lg:p-6 bg-slate-50 dark:bg-slate-900 h-[calc(100vh-4rem)] overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-3">
        <section className="rounded-md bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-3.5 md:p-4 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] tracking-tight">
                Ticket Management
              </h1>
              <p className="mt-0.5 text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                View and filter support tickets submitted by users.
              </p>
            </div>

            <button
              onClick={() => fetchTickets({ isRefresh: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] md:text-xs font-semibold font-['Sora'] transition-colors"
            >
              <MdRefresh className={refreshing ? 'animate-spin' : ''} />
              Refresh Tickets
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-2 lg:grid-cols-3 gap-2">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/60 p-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-['Sora'] leading-tight uppercase tracking-wide">
                        {card.label}
                      </p>
                      <p className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora'] leading-none">
                        {loading ? '...' : card.value}
                      </p>
                    </div>
                    <Icon className="text-base text-slate-500 dark:text-slate-300 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-3.5 md:p-4 flex-1 min-h-0 flex flex-col">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2.5 shrink-0">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by subject, description, or user"
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs md:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <MdFilterList className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="pl-8 pr-7 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] md:text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="all">All Categories</option>
                  <option value="loan">Loan</option>
                  <option value="crop">Crop</option>
                  <option value="technical">Technical</option>
                  <option value="account">Account</option>
                  <option value="training">Training</option>
                  <option value="general">General</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] md:text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <div className="md:hidden h-full overflow-auto space-y-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 p-2">
              {loading && (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                    <span className="w-3.5 h-3.5 rounded-md border-2 border-emerald-500 border-t-transparent animate-spin" />
                    Loading tickets...
                  </div>
                </div>
              )}

              {!loading && paginatedTickets.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                  No tickets match your filters.
                </div>
              )}

              {!loading &&
                paginatedTickets.map((ticket) => {
                  const user = ticket.userId;
                  const name = typeof user === 'object' && user?.name ? user.name : 'Unknown user';
                  const email = typeof user === 'object' && user?.email ? user.email : '';

                  return (
                    <div
                      key={ticket._id}
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                      onClick={() => openTicketModal(ticket)}
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora'] line-clamp-2">
                        {ticket.subject || 'Untitled'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora'] mt-1">
                        {name}
                        {email ? ` • ${email}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-['Sora'] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <MdSupportAgent className="text-xs" />
                          {formatCategory(ticket.category)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora']">
                          {ticket.priority || 'Medium'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold font-['Sora'] ${getStatusTone(ticket.status)}`}
                        >
                          {ticket.status || 'Open'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="hidden md:block h-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 overflow-hidden">
              <div className="h-full overflow-auto">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[22%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">
                        Subject
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">
                        User
                      </th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">
                        Category
                      </th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">
                        Priority
                      </th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">
                        Status
                      </th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">
                        Created
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">
                        Preview
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                            <span className="w-3.5 h-3.5 rounded-md border-2 border-emerald-500 border-t-transparent animate-spin" />
                            Loading tickets...
                          </div>
                        </td>
                      </tr>
                    )}

                    {!loading && paginatedTickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                          No tickets match your filters.
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      paginatedTickets.map((ticket) => {
                        const user = ticket.userId;
                        const name = typeof user === 'object' && user?.name ? user.name : 'Unknown';
                        const email = typeof user === 'object' && user?.email ? user.email : '';

                        return (
                          <tr
                            key={ticket._id}
                            className="border-t border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                            onClick={() => openTicketModal(ticket)}
                          >
                            <td className="px-3 py-2.5 align-top">
                              <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora'] line-clamp-2">
                                {ticket.subject || 'Untitled'}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate font-['Sora']">
                                {name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-['Sora']">
                                {email || '—'}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-center text-[11px] text-slate-700 dark:text-slate-300 font-['Sora']">
                              {formatCategory(ticket.category)}
                            </td>
                            <td className="px-3 py-2.5 text-center text-[11px] text-slate-600 dark:text-slate-300 font-['Sora']">
                              {ticket.priority || 'Medium'}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold font-['Sora'] ${getStatusTone(ticket.status)}`}
                              >
                                {ticket.status || 'Open'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center text-[11px] text-slate-600 dark:text-slate-300 font-['Sora'] whitespace-nowrap">
                              {formatDate(ticket.createdAt)}
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-['Sora'] line-clamp-3">
                                {ticket.description || '—'}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between shrink-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">
              Showing {paginatedTickets.length} of {filteredTickets.length} tickets
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                Prev
              </button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {ticketModal.isOpen && ticketModal.ticket && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close ticket popup"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeTicketModal}
          />

          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">
                  Ticket Details
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                  {modalReplyLocked
                    ? 'This ticket is resolved. Status and admin reply are read-only.'
                    : 'View ticket information and update status or admin reply.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTicketModal}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MdClose />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Subject
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {ticketModal.ticket.subject || '—'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  User Name
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {ticketModal.ticket.userId?.name || 'Unknown'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  User Email
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {ticketModal.ticket.userId?.email || '—'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Category
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {formatCategory(ticketModal.ticket.category)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Priority
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {ticketModal.ticket.priority || 'Medium'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Created Date
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {formatDate(ticketModal.ticket.createdAt)}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Description
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-h-24 whitespace-pre-wrap">
                  {ticketModal.ticket.description || '—'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Status
                </label>
                {modalReplyLocked ? (
                  <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold font-['Sora'] ${getStatusTone(ticketModal.ticket.status)}`}
                    >
                      {ticketModal.ticket.status || 'Open'}
                    </span>
                  </div>
                ) : (
                  <select
                    value={ticketModal.status}
                    onChange={(event) =>
                      setTicketModal((prev) => ({ ...prev, status: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                  >
                    {TICKET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Admin Reply
                </label>
                {modalReplyLocked ? (
                  <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-h-24 whitespace-pre-wrap">
                    {ticketModal.ticket.adminReply?.trim() ? ticketModal.ticket.adminReply : '—'}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    value={ticketModal.adminReply}
                    onChange={(event) =>
                      setTicketModal((prev) => ({ ...prev, adminReply: event.target.value }))
                    }
                    placeholder="Write admin reply here..."
                    className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
                  />
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              {modalReplyLocked ? (
                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="px-4 py-2 rounded-md text-sm font-medium font-['Sora'] bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeTicketModal}
                    className="px-3 py-2 rounded-md text-sm font-medium font-['Sora'] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTicket}
                    disabled={ticketModal.saving}
                    className="px-4 py-2 rounded-md text-sm font-medium font-['Sora'] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    {ticketModal.saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
