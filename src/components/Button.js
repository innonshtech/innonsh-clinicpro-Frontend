export default function Button({ children, icon, ...props }) {
  return (
    <button
      {...props}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  )
}
