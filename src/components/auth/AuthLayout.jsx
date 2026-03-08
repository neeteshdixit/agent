function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1f2937,_#09090b_55%)] px-4 py-10">
      {children}
    </div>
  );
}

export default AuthLayout;
