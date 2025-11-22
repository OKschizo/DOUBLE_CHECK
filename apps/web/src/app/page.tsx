import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-accent-primary">DoubleCheck</span>
        </h1>
        <p className="text-xl text-text-secondary mb-8">
          Film Production Management Platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    </main>
  );
}

