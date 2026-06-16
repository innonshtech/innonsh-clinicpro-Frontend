import { API_BASE_URL } from './api';

/**
 * Service to handle all appointment-related API interactions.
 */
export const appointmentService = {
  /**
   * Book a new appointment.
   * @param {Object} data - Appointment data (patientId, doctorId, appointmentDate, timeSlot, reason)
   * @param {string} token - Auth JWT token
   */
  async createAppointment(data, token) {
    // Map frontend 'date' field to backend's expected 'appointmentDate'
    const { date, ...rest } = data;
    const payload = {
      ...rest,
      appointmentDate: date || rest.appointmentDate,
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/appointment/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401 || errorData.errorCode === 'INVALID_TOKEN') {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
          return { success: false }; // Prevent throwing to keep terminal clean
        }
      }
      const err = new Error(errorData.message || 'Failed to book appointment');
      err.code = errorData?.error?.code || errorData.code;
      err.responseBody = errorData;
      throw err;
    }

    return response.json();
  },

  /**
   * Fetch paginated and filtered list of appointments.
   * @param {Object} params - Query filters (page, limit, doctorId, date, status)
   * @param {string} token - Auth JWT token
   */
  async getAppointments(params = {}, token) {
    try {
      const query = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.doctorId && { doctorId: params.doctorId }),
        ...(params.date && { date: params.date }),
        ...(params.status && { status: params.status }),
      }).toString();

      const response = await fetch(`${API_BASE_URL}/api/v1/appointment/list?${query}`, {
        cache: 'no-store', // Disable caching for real-time dashboard data
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401 || error.errorCode === 'INVALID_TOKEN') {
          if (typeof window !== 'undefined') {
            localStorage.clear();
            window.location.href = '/login';
          }
        }
        return { success: false, data: [] };
      }

      return await response.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  /**
   * Update appointment status.
   * @param {string} id - Appointment ID
   * @param {string} status - New status
   * @param {string} token - Auth JWT token
   */
  async updateStatus(id, status, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointment/status/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error.errorCode === 'INVALID_TOKEN') {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
          return { success: false }; // Prevent throwing to keep terminal clean
        }
      }
      throw new Error(error.message || 'Failed to update status');
    }

    return response.json();
  },

  /**
   * Cancel an appointment with a reason.
   */
  async cancelAppointment(id, reason, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointment/cancel/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error.errorCode === 'INVALID_TOKEN') {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
          return { success: false }; // Prevent throwing to keep terminal clean
        }
      }
      throw new Error(error.message || 'Failed to cancel appointment');
    }

    return response.json();
  },

  /**
   * Fetch appointment history for a specific patient.
   */
  async getPatientHistory(patientId, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointment/patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error.errorCode === 'INVALID_TOKEN') {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
          return { success: false }; // Prevent throwing to keep terminal clean
        }
      }
      throw new Error(error.message || 'Failed to fetch appointment history');
    }

    return response.json();
  },

  /**
   * Check in a patient for their appointment.
   */
  async checkIn(id, token, lateStrategy = null) {
    const body = lateStrategy ? JSON.stringify({ lateStrategy }) : null;
    const response = await fetch(`${API_BASE_URL}/api/v1/appointment/check-in/${id}`, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error.errorCode === 'INVALID_TOKEN') {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
          return { success: false }; // Prevent throwing to keep terminal clean
        }
      }
      throw new Error(error.message || 'Check-in failed');
    }

    return response.json();
  },

  /**
   * Reschedule an appointment.
   * @param {string} id - Appointment ID
   * @param {Object} data - New date and time slot
   * @param {string} token - Auth JWT token
   */
  async rescheduleAppointment(id, data, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointment/reschedule/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error.errorCode === 'INVALID_TOKEN') {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
          return { success: false }; // Prevent throwing to keep terminal clean
        }
      }
      throw new Error(error.message || 'Reschedule failed');
    }

    return response.json();
  }
};
