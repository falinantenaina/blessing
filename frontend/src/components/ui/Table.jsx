import { cn } from "@/utils/helpers";

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-gray-200", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-gray-50">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHead({ children, className }) {
  return (
    <th
      className={cn(
        "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
  );
}

export function TableRow({ children, className, onClick }) {
  return (
    <tr
      className={cn(onClick && "cursor-pointer hover:bg-gray-50", className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className }) {
  return (
    <td
      className={cn(
        "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
        className,
      )}
    >
      {children}
    </td>
  );
}
