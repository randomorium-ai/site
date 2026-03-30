import { apps } from "@/data/apps";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Nav */}
      <header className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-sm font-medium tracking-tight">randomorium.ai</span>
        <nav className="flex items-center gap-3">
          <a
            href="/apps/bizaar"
            className="text-xs text-zinc-600 px-3 py-2 rounded-full border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
          >
            Play Bizaar
          </a>
          <a
            href="https://shop.randomorium.ai"
            className="text-xs bg-black text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            buy a hat →
          </a>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 px-6 py-20 max-w-3xl mx-auto w-full">
        <p className="font-mono text-xs text-zinc-400 mb-3">est. 2025</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 mb-4">
          random apps.<br />ironic hats.
        </h1>
        <p className="text-zinc-500 text-base max-w-md leading-relaxed mb-16">
          We build whatever seems funny. Every app is a thin excuse to sell you an embroidered cap.
        </p>

        {/* Apps */}
        <section>
          <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-6">
            the apps
          </h2>
          {apps.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-xl p-10 text-center">
              <p className="text-zinc-400 text-sm">apps loading... check back soon.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {apps.map((app) => (
                <li key={app.slug}>
                  <a
                    href={app.url}
                    {...(app.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group block border border-zinc-100 rounded-xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-zinc-900">{app.name}</span>
                      <span className="text-xs text-zinc-400 font-mono">by {app.author}</span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{app.description}</p>
                    <p className="text-xs text-zinc-400 italic border-t border-zinc-100 pt-3">
                      🎩 {app.hatHook}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Shop CTA */}
        <section className="mt-24 border border-zinc-100 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-mono text-zinc-400 mb-1">the real reason this exists</p>
            <h3 className="text-lg font-semibold text-zinc-900">Buy an ironic hat.</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Embroidered caps. Two-word phrases. Free shipping of dignity not included.
            </p>
          </div>
          <a
            href="https://shop.randomorium.ai"
            className="shrink-0 bg-black text-white text-sm px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors"
          >
            shop now →
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-6 py-6 text-xs text-zinc-400 font-mono flex justify-between">
        <span>randomorium.ai</span>
        <span>harry · matt · sol</span>
      </footer>
    </div>
  );
}
