// app/clinic/receptionists/add/page.jsx
export default function AddReceptionistPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add New Receptionist</h2>
      <form className="grid gap-4 max-w-md">
        <input className="border p-2" placeholder="Full Name" />
        <input className="border p-2" placeholder="Email" />
        <input className="border p-2" placeholder="Phone Number" />
        <input className="border p-2" placeholder="Username" />
        <input className="border p-2" placeholder="Password" type="password" />
        <button className="bg-purple-600 text-white px-4 py-2 rounded">
          Submit
        </button>
      </form>
    </div>
  );
}
