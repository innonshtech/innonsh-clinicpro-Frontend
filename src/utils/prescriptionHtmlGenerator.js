/**
 * Generates an aligned, printable HTML template for a doctor prescription.
 * @param {Object} data
 * @param {Object} data.doctor
 * @param {Object} data.patient
 * @param {Array} data.medicines
 * @param {string} data.notes
 * @returns {string} Fully styled HTML string
 */
export const generatePrescriptionHtml = (data) => {
  const { doctor = {}, patient = {}, medicines = [], notes = '', template = {} } = data;

  const primaryColor = template.primaryColor || '#0f766e'; // Default Teal
  const headerText = template.headerText || 'Providing Quality Healthcare with Compassion';
  const footerText = template.footerText || 'Valid for 15 days from date of consultation.';

  const medRows = medicines.map(med => `
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px;">
      <div>
        <p style="font-weight: 700; color: #1e293b; margin: 0; font-size: 14px;">${med.name}</p>
        <p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0; font-style: italic;">
          Dosage: ${med.dosage || 'N/A'} | Duration: ${med.duration || 'N/A'}
        </p>
        ${med.instructions ? `<p style="color: #64748b; font-size: 10px; margin: 2px 0 0 0;">Note: ${med.instructions}</p>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Prescription - ${patient.firstName || 'Patient'}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          background-color: #ffffff;
          color: #334155;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .container {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          background-color: #ffffff;
        }
        .header {
          padding: 30px 40px 15px 40px;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .clinic-info h2 {
          color: ${primaryColor};
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        .doctor-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 5px 0 0 0;
        }
        .doctor-qual {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          margin: 2px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doctor-spec {
          font-size: 12px;
          color: #64748b;
          margin: 4px 0 0 0;
          font-weight: 500;
        }
        .doctor-reg {
          font-size: 10px;
          font-family: monospace;
          color: #94a3b8;
          margin: 2px 0 0 0;
        }
        .clinic-logo {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .logo-box {
          width: 60px;
          height: 60px;
          background-color: #f0fdfa;
          border: 1px solid #ccfbf1;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: #0f766e;
          overflow: hidden;
        }
        .logo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .logo-text {
          font-size: 12px;
          font-weight: 900;
          color: #0f766e;
          margin-top: 6px;
        }
        .patient-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 30px;
          row-gap: 10px;
          border-top: 1px solid rgba(15, 118, 110, 0.2);
          border-bottom: 1px solid rgba(15, 118, 110, 0.2);
          padding: 12px 0;
          margin-top: 25px;
          font-size: 12px;
          font-weight: 500;
        }
        .patient-field {
          display: flex;
          border-bottom: 1px dotted #cbd5e1;
          padding-bottom: 4px;
        }
        .field-label {
          color: #94a3b8;
          width: 90px;
          flex-shrink: 0;
        }
        .field-value {
          color: #1e293b;
          font-weight: 700;
        }
        .workspace {
          flex: 1;
          display: flex;
          border-top: 1px solid #e2e8f0;
        }
        .rx-column {
          width: 25%;
          background-color: rgba(240, 253, 250, 0.4);
          border-right: 1px solid #ccfbf1;
          padding: 25px;
          box-sizing: border-box;
        }
        .rx-symbol {
          font-family: Georgia, serif;
          font-weight: 900;
          font-size: 40px;
          color: ${primaryColor};
        }
        .content-column {
          width: 75%;
          padding: 30px 40px;
          box-sizing: border-box;
        }
        .clinical-notes {
          background-color: #f8fafc;
          border-left: 3px solid #0f766e;
          padding: 12px 15px;
          margin-bottom: 25px;
          border-radius: 4px;
          font-size: 12px;
        }
        .notes-title {
          font-weight: 700;
          color: #0f766e;
          margin: 0 0 5px 0;
        }
        .notes-text {
          color: #475569;
          margin: 0;
          line-height: 1.5;
        }
        .footer {
          background-color: ${primaryColor};
          color: #ffffff;
          padding: 15px 40px;
          position: relative;
          overflow: hidden;
        }
        .footer-bg-left {
          position: absolute;
          left: 0; top: 0; bottom: 0; width: 40px;
          background-color: rgba(0,0,0,0.2);
          transform: skewX(30deg);
          transform-origin: top left;
        }
        .footer-bg-right {
          position: absolute;
          right: 0; top: 0; bottom: 0; width: 40px;
          background-color: rgba(0,0,0,0.2);
          transform: skewX(-30deg);
          transform-origin: top right;
        }
        .footer-content {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <div class="clinic-info">
              <h2>${doctor.clinicName || 'Health Care Medical Clinic'}</h2>
              <p class="doctor-name">${doctor.firstName || 'Dr. Alex'} ${doctor.lastName || 'Justin'}</p>
              <p class="doctor-qual">${doctor.qualification || 'MBBS, MD'}</p>
              <p class="doctor-spec">${doctor.specialty || 'General Practitioner'}</p>
              <p class="doctor-reg">Reg No: ${doctor.registrationNumber || 'N/A'}</p>
            </div>
            <div class="clinic-logo">
              <div class="logo-box">
                ${doctor.clinicLogo ? `<img src="${doctor.clinicLogo}" alt="logo">` : 'H+'}
              </div>
              <span class="logo-text">Healthcare</span>
            </div>
          </div>

          <div class="patient-bar">
            <div class="patient-field">
              <span class="field-label">Patient Name:</span>
              <span class="field-value">${patient.firstName || ''} ${patient.lastName || ''}</span>
            </div>
            <div class="patient-field">
              <span class="field-label">Age:</span>
              <span class="field-value">${patient.age || 'N/A'} Years</span>
            </div>
            <div class="patient-field">
              <span class="field-label">Address:</span>
              <span class="field-value">${patient.address || 'N/A'}</span>
            </div>
            <div class="patient-field">
              <span class="field-label">Date:</span>
              <span class="field-value">${new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div class="workspace">
          <div class="rx-column">
            <span class="rx-symbol">℞</span>
          </div>
          <div class="content-column">
            ${notes ? `
              <div class="clinical-notes">
                <p class="notes-title">Clinical Findings & Diagnosis</p>
                <p class="notes-text">${notes}</p>
              </div>
            ` : ''}
            
            <div class="medicines-list">
              ${medRows}
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-bg-left"></div>
          <div class="footer-bg-right"></div>
          <div class="footer-content">
            <div>📞 ${doctor.phone || '+123 456 789'}</div>
            <div>🌐 ${doctor.clinicWebsite || 'yourwebsite.com'}</div>
            <div>📍 ${doctor.clinicAddress || 'Road 7, Hill House'}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
