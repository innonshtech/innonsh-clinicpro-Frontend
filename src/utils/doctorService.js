import { API_BASE_URL } from './api';

/**
 * Service to handle all doctor-related API interactions.
 */
export const doctorService = {
  /**
   * Fetch all doctors.
   * @param {string} token - Auth JWT token
   */
  async getDoctors(token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/doctor/fetchAll`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch doctors');
    }

    return response.json();
  },

  /**
   * Fetch available slots for a doctor on a specific date.
   * @param {string} doctorId 
   * @param {string} date 
   * @param {string} token - Auth JWT token
   */
  async getAvailableSlots(doctorId, date, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/doctor/availability?doctorId=${doctorId}&date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch slots');
    }

    return response.json();
  }
};
