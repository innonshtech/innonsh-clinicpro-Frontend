export default function Card({ title, children, action }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {action && (
            <a href={action.href} className="text-sm font-medium text-blue-600 hover:text-blue-500">
              {action.text}
            </a>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
