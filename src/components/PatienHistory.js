import Link from 'next/link';

export default function PatientHistoryCTA() {
  return (
    <section className="bg-white rounded-lg shadow-md p-8 md:p-12 mx-4 md:mx-8 mt-4 mb-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Track Patient Health History
        </h2>

        {/* Subtitle / description */}
        <p className="text-lg text-gray-600 mb-8">
          View past medical checkups, prescriptions, lab results, and any injections or medications taken. Stay on top of the health data in one place.
        </p>

        {/* Single Centered Button */}
        <div className="flex justify-center">
          <Link
            href="/patient-history"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full transition"
          >
            View History
          </Link>
        </div>
      </div>
    </section>
  );
}
