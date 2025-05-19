import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>MonkeyZ - 404 Not Found</title>
        <meta name="description" content="Page not found. The page you are looking for does not exist on MonkeyZ." />
        <meta property="og:title" content="MonkeyZ - 404 Not Found" />
        <meta property="og:description" content="Page not found. The page you are looking for does not exist on MonkeyZ." />
      </Helmet>
      <main className="flex flex-col items-center justify-center min-h-screen text-center bg-primary">
        <section>
          <h1
            className="text-6xl font-extrabold text-accent mb-4 drop-shadow-lg"
            tabIndex={0}
            aria-label="404 Page Not Found"
          >
            404
          </h1>
          <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="mb-6 text-lg text-gray-300">
            Sorry, the page you are looking for does not exist.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-accent text-primary rounded-lg shadow hover:bg-border transition font-semibold"
          >
            Go to Homepage
          </Link>
        </section>
      </main>
    </>
  );
};

export default NotFound;
