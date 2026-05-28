// app/api/cities/route.js
export const dynamic = 'force-static'; // Optional: cache the response

const puneCities = [
  "Pune City",
  "Kothrud",
  "Karve Nagar",
  "Erandwane",
  "Deccan",
  "Shivajinagar",
  "FC Road",
  "JM Road",
  "Bibwewadi",
  "Kondhwa",
  "Katraj",
  "Dhankawadi",
  "Sinhagad Road",
  "Hadapsar",
  "Magarpatta",
  "Kharadi",
  "Viman Nagar",
  "Lohegaon",
  "Wagholi",
  "Kalyani Nagar",
  "Koregaon Park",
  "Aundh",
  "Baner",
  "Pashan",
  "Hinjewadi",
  "Wakad",
  "Pimple Saudagar",
  "Rahatani",
  "Pimple Nilakh",
  "Pimple Gurav",
  "Ravet",
  "Chinchwad",
  "Akurdi",
  "Nigdi",
  "Pimpri",
  "Bhosari",
  "Moshi",
  "Chakan",
  "Talegaon",
  "Alandi",
  "Shikrapur"
];

export async function GET() {
  return Response.json(puneCities);
}
