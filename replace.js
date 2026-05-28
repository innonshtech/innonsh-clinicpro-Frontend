const fs = require('fs');

const path = 'src/app/patient-dashboard/layout.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<header className="sticky top-0 z-30 bg-white border-b border-slate-100">[\s\S]*?<\/header>/;

const replacement = `<header className="sticky top-0 z-30 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between h-16 px-8">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-4">
                <FiMenu className="w-5 h-5" />
              </button>

              <div className="hidden lg:flex flex-col min-w-[200px]">
                <h2 className="text-xl font-bold text-slate-800 leading-tight">Dashboard</h2>
                <div className="flex items-center text-sm font-medium text-slate-500 mt-0.5">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center text-slate-500 hover:text-slate-800 cursor-pointer transition-colors text-sm font-medium">
                 <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                 EN
              </div>

              <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                 <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

              <div className="relative">
                <button className="flex items-center space-x-3 hover:bg-slate-50 transition-all rounded-lg p-1 border border-transparent">
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-semibold text-slate-800 capitalize truncate">Welcome, John</p>
                    <p className="text-xs text-slate-500 capitalize truncate">Patient</p>
                  </div>
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white overflow-hidden font-bold text-sm">
                    J
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>`;

if (regex.test(content)) {
  fs.writeFileSync(path, content.replace(regex, replacement));
  console.log("Successfully replaced the header!");
} else {
  console.error("Regex did not match anything.");
}
