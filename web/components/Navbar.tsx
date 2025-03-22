const Navbar = () => (
  <nav className="w-full bg-finance-green text-finance-black p-4 z-50 shadow-md">
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center">

        <div  className="flex items-center gap-2">
          <span className="text-xl font-bold">FinTrack</span>
        </div>

        <button
          className="focus:outline-none"
          aria-label="Toggle menu"
        >
          MENU
        </button>
      </div>
    </div>
  </nav>
);

export default Navbar;
