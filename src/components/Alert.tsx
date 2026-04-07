// week-6-sprint-4 : reusable alert component for success and error messages across the UI

type AlertProps = {
  type: "success" | "error";
  message: string;
};

export default function Alert({ type, message }: AlertProps) {

  const styles = {
    success: "bg-green-100 text-green-700 border border-green-300",
    error: "bg-red-100 text-red-700 border border-red-300"
  };

  return (
  <div
    className={`
      p-3 rounded-md mb-4 text-sm font-medium shadow-md animate-fade-in
      ${styles[type]}
    `}
  >
    {message}
  </div>
);
}