import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { DoctorProvider } from "@/context/DoctorContext";

export const metadata = {
  title: "ClinicPro",
  description: "Modern clinic management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <DoctorProvider>
            {children}
          </DoctorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
