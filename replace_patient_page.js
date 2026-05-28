const fs = require('fs');
const path = 'src/app/patient-dashboard/page.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="flex justify-between items-center">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `{/* Page Header */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center text-sm text-slate-500 font-medium">
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Home</span>
          <span className="mx-2">/</span>
          <span className="text-slate-800">Dashboard</span>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {patientData?.firstName || 'Patient'}!
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Here's your health dashboard overview.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshDashboard}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FiClock className="text-white w-4 h-4" />
              <span>Refresh</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl">
              <FiClock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Last updated: {formatLastUpdated()}</span>
            </div>
          </div>
        </div>
      </div>`;

if (regex.test(content)) {
  fs.writeFileSync(path, content.replace(regex, replacement));
  console.log("Successfully replaced the patient dashboard page header!");
} else {
  console.error("Regex did not match anything in patient page.");
}
