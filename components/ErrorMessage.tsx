export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"
    >
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
