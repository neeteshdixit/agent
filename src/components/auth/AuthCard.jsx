function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-panel backdrop-blur">
      <h1 className="text-2xl font-semibold text-zinc-100">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-zinc-400">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-zinc-800 pt-4 text-sm text-zinc-400">{footer}</div> : null}
    </div>
  );
}

export default AuthCard;
