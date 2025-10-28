import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

function Navbar() {
  const { auth } = usePuterStore();

  return (
    <>
      {auth.isAuthenticated ? (
        <button
          onClick={auth.signOut}
          title="Logout"
          aria-label="Logout"
          className="fixed top-2 right-2 z-50 h-10 w-10 rounded-full bg-white/80 hover:bg-white border border-gray-200 shadow flex items-center justify-center text-gray-700 hover:text-red-600 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 ml-1"
          >
            <path d="M16 17v-2h-4v-2h4V11l3 3-3 3z" />
            <path d="M5 3h8a2 2 0 0 1 2 2v4h-2V5H5v14h8v-4h2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          </svg>
        </button>
      ) : (
        <button
          onClick={auth.signIn}
          title="Login"
          aria-label="Login"
          className="fixed top-2 right-2 z-50 h-10 w-10 rounded-full bg-white/80 hover:bg-white border border-gray-200 shadow flex items-center justify-center text-gray-700 hover:text-blue-600 transition"
        >
          <span className="text-xs font-semibold">Login</span>
        </button>
      )}
      <div className="navbar mt-4">
        <Link to="/">
          <p className="text-2xl font-bold text-gradient"> RESUMAI</p>
        </Link>
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>
      </div>
    </>
  );
}

export default Navbar;