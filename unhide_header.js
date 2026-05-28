const fs = require('fs');

const path = 'src/app/doctor-dashboard/appointments/page.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="hidden bg-white\/70 backdrop-blur-lg rounded-2xl shadow-sm p-6 mb-6 border border-white\/80">/;

if (regex.test(content)) {
  fs.writeFileSync(path, content.replace(regex, '<div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm p-6 mb-6 border border-white/80">'));
  console.log("Successfully removed hidden class from doctor dashboard appointments header!");
} else {
  console.error("Regex did not match anything.");
}
