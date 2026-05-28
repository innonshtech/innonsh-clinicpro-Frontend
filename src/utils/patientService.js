import { API_BASE_URL } from './api';

/**
 * Service to handle all patient-related API interactions.
 */
export const patientService = {
  /**
   * Fetch paginated and filtered list of patients.
   * @param {Object} params - Query parameters (page, limit, name, phoneNumber)
   * @param {string} token - Auth JWT token
   */
  async getPatients(params = {}, token) {
    const query = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.name && { name: params.name }),
      ...(params.phoneNumber && { phoneNumber: params.phoneNumber }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    }).toString();

    const response = await fetch(`${API_BASE_URL}/api/v1/patient/list?${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch patients');
    }

    return response.json();
  },

  /**
   * Fetch a single patient profile by ID.
   * @param {string} id - Patient ID
   * @param {string} token - Auth JWT token
   */
  async getPatientById(id, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/patient/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch patient profile');
    }

    return response.json();
  },

  /**
   * Register a new patient.
   * @param {Object} patientData - Patient data object
   * @param {string} token - Auth JWT token
   */
  async registerPatient(patientData, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/patient/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register patient');
    }

    return response.json();
  },

  /**
   * Update an existing patient.
   * @param {string} id - Patient ID
   * @param {Object} patientData - Updated patient data
   * @param {string} token - Auth JWT token
   */
  async updatePatient(id, patientData, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/patient/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update patient');
    }

    return response.json();
  },

  /**
   * Delete a patient.
   * @param {string} id - Patient ID
   * @param {string} token - Auth JWT token
   */
  async deletePatient(id, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/patient/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete patient');
    }

    return response.json();
  },
};
