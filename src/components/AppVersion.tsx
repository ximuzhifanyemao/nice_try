export default function AppVersion() {
  const version = __APP_VERSION__
  const hash = __APP_GIT_HASH__
  const message = __APP_GIT_MESSAGE__

  return (
    <div className="text-center text-[11px] text-gray-400 dark:text-slate-500 space-y-0.5 select-all">
      <p>
        <span className="font-mono">v{version}</span>
        {hash && <span className="font-mono"> ({hash})</span>}
      </p>
      {message && (
        <p className="truncate px-6 max-w-xl mx-auto" title={message}>
          {message}
        </p>
      )}
    </div>
  )
}
