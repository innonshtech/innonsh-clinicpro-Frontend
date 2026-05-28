const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  {
    path: 'src/app/doctor-dashboard/patients/page.jsx',
    title: 'Patient Management',
    desc: 'Manage all patient records and history',
    regex: /<div className="bg-white rounded-lg shadow-sm p-6 mb-6">/
  },
  {
    path: 'src/app/receptionist-dashboard/patients/page.jsx',
    title: 'Patient Management',
    desc: 'Manage all patient records and history',
    regex: /<div className="bg-white rounded-lg shadow-sm p-6 mb-6">/
  },
  {
    path: 'src/app/receptionist-dashboard/appointments/page.jsx',
    title: 'Appointment Management',
    desc: 'View and manage patient appointments',
    regex: /<div className="max-w-7xl mx-auto">/
  }
];

filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes(`h1 className="text-2xl font-bold`)) {
      const headerStr = `
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">${file.title}</h1>
          <p className="text-sm text-gray-500">${file.desc}</p>
        </div>
      `;
      content = content.replace(file.regex, match => headerStr + match);
      fs.writeFileSync(fullPath, content);
      console.log(`Injected header into ${file.path}`);
    } else {
      console.log(`Header already exists in ${file.path}`);
    }
  } else {
    console.log(`File not found: ${file.path}`);
  }
});
