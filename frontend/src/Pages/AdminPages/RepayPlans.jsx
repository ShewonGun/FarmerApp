import React, { useState, useEffect } from 'react';
import { MdAdd } from 'react-icons/md';
import PlanCard from '../../Components/AdminComponents/PlanCard';
import AddPlanModal from '../../Components/AdminComponents/AddPlanModal';
import ConfirmBox from '../../Components/SharedComponents/ConfirmBox';
import axios from 'axios';
import { showSuccess, showError } from '../../utils/toast';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const RepayPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/plans`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setPlans(response.data.plans || []);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      showError('Failed to fetch repayment plans');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setIsModalOpen(true);
  
  const closeModal = () => {
    setEditingPlan(null);
    setIsModalOpen(false);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleSubmitPlan = async (data) => {
    try {
      if (editingPlan) {
        const res = await axios.put(
          `${API_BASE_URL}/plans/${editingPlan._id}`,
          data,
          { headers: getAuthHeaders() }
        );
        if (res.data.success) {
          showSuccess('Plan updated successfully');
          fetchPlans();
        }
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/plans`,
          data,
          { headers: getAuthHeaders() }
        );
        if (res.data.success) {
          showSuccess('Plan created successfully');
          fetchPlans();
        }
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      showError(editingPlan ? 'Failed to update plan' : 'Failed to create plan');
      throw err;
    }
  };

  const openDeleteConfirm = (id, name) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const closeDeleteConfirm = () => {
    if (!isDeleting) {
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/plans/${deleteConfirm.id}`,
        { headers: getAuthHeaders() }
      );
      showSuccess('Plan deleted successfully');
      fetchPlans();
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    } catch (err) {
      console.error('Error deleting plan:', err);
      showError('Failed to delete plan');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (planId, planName) => {
    openDeleteConfirm(planId, planName);
  };

  const handleToggleActive = async (planId, currentStatus) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/plans/${planId}`,
        { isActive: !currentStatus },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        showSuccess(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchPlans();
      }
    } catch (err) {
      console.error('Error toggling plan status:', err);
      showError('Failed to update plan status');
    }
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}

          {/* Add Plan Card */}
          <button
            onClick={openModal}
            className="flex items-center justify-center w-full h-full min-h-80 bg-white/10 dark:bg-slate-800/30 rounded-lg shadow-sm border border-white/20 dark:border-slate-700/30 backdrop-blur-md hover:shadow-lg hover:bg-white/20 dark:hover:bg-slate-800/40 transition-all duration-200"
            aria-label="Add plan"
            title="Add repayment plan"
          >
            <MdAdd className="text-5xl text-emerald-600 dark:text-emerald-300" />
          </button>
        </div>
      )}

      <AddPlanModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitPlan}
        initialData={editingPlan}
      />

      <ConfirmBox
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Plan?"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RepayPlans;
