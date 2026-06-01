import Link from 'next/link';

export default function Footer() {
  const footerLinks = [
    {
      title: "ClinicPro",
      links: ["About", "Blog", "Careers", "Press", "Contact Us"]
    },
    {
      title: "For Patients",
      links: ["Search for Doctors", "Search for Clinics", "Search for Hospitals", "Book Diagnostic Tests", "Medicines"]
    },
    {
      title: "For Doctors",
      links: ["ClinicPro Profile", "For Clinics", "Ray by ClinicPro", "ClinicPro Reach", "Health Feed"]
    },
    {
      title: "More",
      links: ["Help", "Developers", "Privacy Policy", "Terms & Conditions", "Healthcare Directory"]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {footerLinks.map((section, index) => (
          <div key={index}>
            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
            <ul className="space-y-2">
              {section.links.map((link, idx) => (
                <li key={idx}>
                  <Link href="#" className="text-gray-400 hover:text-white">
                  {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
        <p>© 2025 ClinicPro. All rights reserved.</p>
      </div>
    </footer>
  );
}
