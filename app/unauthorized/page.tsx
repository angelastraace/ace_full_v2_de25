export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    </div>
  );
}
