import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 bg-background-primary">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 text-text-primary">
          <span className="text-accent-primary">DoubleCheck</span>
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary mb-8">
          Film Production Management Platform
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="btn-primary px-6 py-3"
            style={{ color: 'rgb(var(--button-text-on-accent))' }}
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="btn-secondary px-6 py-3"
          >
            Learn More
          </Link>
        </div>
      </div>
    </main>
  );
}

