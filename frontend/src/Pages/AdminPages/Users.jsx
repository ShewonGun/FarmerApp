import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  MdPeople,
  MdPerson,
  MdAdminPanelSettings,
  MdBlock,
  MdCheckCircle,
  MdRefresh,
  MdSearch,
  MdFilterList,
  MdAdd,
} from 'react-icons/md';
import ConfirmBox from '../../Components/SharedComponents/ConfirmBox';
import AddAdminModal from '../../Components/AdminComponents/AddAdminModal';
import { showError, showSuccess } from '../../utils/toast';

const API_BASE_URL = 'http://localhost:5000/api';
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

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    userId: '',
    userName: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const fetchUsers = async ({ isRefresh = false } = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
      });

      setUsers(response?.data?.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const farmers = users.filter((user) => user.role === 'farmer').length;
    const admins = users.filter((user) => user.role === 'admin').length;
    const active = users.filter((user) => user.isActive !== false).length;
    const inactive = total - active;

    return { total, farmers, admins, active, inactive };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const userStatus = user.isActive === false ? 'inactive' : 'active';
      const matchesStatus = statusFilter === 'all' || statusFilter === userStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openDeactivateConfirm = (user) => {
    setConfirmState({
      isOpen: true,
      userId: user._id,
      userName: user.name || 'this user',
    });
  };

  const closeDeactivateConfirm = () => {
    if (!isUpdating) {
      setConfirmState({ isOpen: false, userId: '', userName: '' });
    }
  };

  const handleDeactivate = async () => {
    try {
      setIsUpdating(true);

      await axios.put(
        `${API_BASE_URL}/user/${confirmState.userId}/deactivate`,
        {},
        { headers: getAuthHeaders() }
      );

      showSuccess('User deactivated successfully');
      setConfirmState({ isOpen: false, userId: '', userName: '' });
      fetchUsers({ isRefresh: true });
    } catch (error) {
      console.error('Error deactivating user:', error);
      showError(error?.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/user/${userId}/activate`,
        {},
        { headers: getAuthHeaders() }
      );

      showSuccess('User activated successfully');
      fetchUsers({ isRefresh: true });
    } catch (error) {
      console.error('Error activating user:', error);
      showError(error?.response?.data?.message || 'Failed to activate user');
    }
  };

  const openAddAdminModal = () => setIsAddAdminOpen(true);
  const closeAddAdminModal = () => {
    if (!isCreatingAdmin) {
      setIsAddAdminOpen(false);
    }
  };

  const handleCreateAdmin = async (payload) => {
    try {
      setIsCreatingAdmin(true);

      await axios.post(
        `${API_BASE_URL}/users/admin`,
        payload,
        { headers: getAuthHeaders() }
      );

      showSuccess('Admin account created successfully');
      setIsAddAdminOpen(false);
      fetchUsers({ isRefresh: true });
    } catch (error) {
      console.error('Error creating admin:', error);
      showError(error?.response?.data?.message || 'Failed to create admin account');
      throw error;
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats.total,
      icon: MdPeople,
    },
    {
      label: 'Farmers',
      value: stats.farmers,
      icon: MdPerson,
    },
    {
      label: 'Admins',
      value: stats.admins,
      icon: MdAdminPanelSettings,
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      icon: MdBlock,
    },
  ];

  return (
    <div className="p-4 md:p-5 lg:p-6 bg-slate-50 dark:bg-slate-900 h-[calc(100vh-4rem)] overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-3">
        <section className="rounded-md bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-3.5 md:p-4 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] tracking-tight">
                User Management
              </h1>
              <p className="mt-0.5 text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                Monitor user accounts, filter records, and manage active status.
              </p>
            </div>

            <button
              onClick={() => fetchUsers({ isRefresh: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] md:text-xs font-semibold font-['Sora'] transition-colors"
            >
              <MdRefresh className={refreshing ? 'animate-spin' : ''} />
              Refresh Users
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2">
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
                placeholder="Search by name or email"
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs md:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <MdFilterList className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="pl-8 pr-7 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] md:text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="all">All Roles</option>
                  <option value="farmer">Farmers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] md:text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={openAddAdminModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[11px] md:text-xs font-semibold font-['Sora'] transition-colors"
              >
                <MdAdd className="text-xs" />
                Add Admin
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <div className="md:hidden h-full overflow-auto space-y-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 p-2">
              {loading && (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                    <span className="w-3.5 h-3.5 rounded-md border-2 border-emerald-500 border-t-transparent animate-spin" />
                    Loading users...
                  </div>
                </div>
              )}

              {!loading && paginatedUsers.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                  No users match your filters.
                </div>
              )}

              {!loading &&
                paginatedUsers.map((user) => {
                  const isActive = user.isActive !== false;
                  const isAdmin = user.role === 'admin';

                  return (
                    <div
                      key={user._id}
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate font-['Sora']">
                          {user.name || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-['Sora']">
                          {user.email || 'No email'}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-['Sora'] ${
                          isAdmin
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {isAdmin ? <MdAdminPanelSettings className="text-xs" /> : <MdPerson className="text-xs" />}
                          {isAdmin ? 'Admin' : 'Farmer'}
                        </span>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-['Sora'] ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                        }`}>
                          {isActive ? <MdCheckCircle className="text-xs" /> : <MdBlock className="text-xs" />}
                          {isActive ? 'Active' : 'Inactive'}
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">
                          Joined {formatDate(user.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2.5 flex justify-end">
                        {isActive && !isAdmin ? (
                          <button
                            onClick={() => openDeactivateConfirm(user)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold font-['Sora'] transition-colors"
                          >
                            <MdBlock className="text-xs" />
                            Deactivate
                          </button>
                        ) : !isActive ? (
                          <button
                            onClick={() => handleActivate(user._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold font-['Sora'] transition-colors"
                          >
                            <MdCheckCircle className="text-xs" />
                            Activate
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-['Sora']">
                            Admin account
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="hidden md:block h-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 overflow-hidden">
              <div className="h-full overflow-auto">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">User</th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">Role</th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">Status</th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">Joined</th>
                      <th className="text-center px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 font-['Sora'] uppercase">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                            <span className="w-3.5 h-3.5 rounded-md border-2 border-emerald-500 border-t-transparent animate-spin" />
                            Loading users...
                          </div>
                        </td>
                      </tr>
                    )}

                    {!loading && paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                          No users match your filters.
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      paginatedUsers.map((user) => {
                        const isActive = user.isActive !== false;
                        const isAdmin = user.role === 'admin';

                        return (
                          <tr
                            key={user._id}
                            className="border-t border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900/40 transition-colors"
                          >
                            <td className="px-3 py-2.5">
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate font-['Sora']">
                                  {user.name || 'Unnamed User'}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-['Sora']">
                                  {user.email || 'No email'}
                                </p>
                              </div>
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-['Sora'] ${
                                isAdmin
                                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              }`}>
                                {isAdmin ? <MdAdminPanelSettings className="text-xs" /> : <MdPerson className="text-xs" />}
                                {isAdmin ? 'Admin' : 'Farmer'}
                              </span>
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-['Sora'] ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                              }`}>
                                {isActive ? <MdCheckCircle className="text-xs" /> : <MdBlock className="text-xs" />}
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            <td className="px-3 py-2.5 text-center text-[11px] text-slate-600 dark:text-slate-300 font-['Sora'] whitespace-nowrap">
                              {formatDate(user.createdAt)}
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              {isActive && !isAdmin ? (
                                <button
                                  onClick={() => openDeactivateConfirm(user)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold font-['Sora'] transition-colors"
                                >
                                  <MdBlock className="text-xs" />
                                  Deactivate
                                </button>
                              ) : !isActive ? (
                                <button
                                  onClick={() => handleActivate(user._id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold font-['Sora'] transition-colors"
                                >
                                  <MdCheckCircle className="text-xs" />
                                  Activate
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-['Sora']">
                                  {isAdmin ? 'Admin account' : 'No action'}
                                </span>
                              )}
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
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </p>

            <div className="flex items-center gap-1.5">
              <button
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

      <ConfirmBox
        isOpen={confirmState.isOpen}
        onClose={closeDeactivateConfirm}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${confirmState.userName}?`}
        confirmText="Deactivate"
        cancelText="Cancel"
        isLoading={isUpdating}
      />

      <AddAdminModal
        isOpen={isAddAdminOpen}
        onClose={closeAddAdminModal}
        onSubmit={handleCreateAdmin}
        isSubmitting={isCreatingAdmin}
      />
    </div>
  );
};

export default Users;
