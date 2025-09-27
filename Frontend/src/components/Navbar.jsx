

const Navbar = ({ user, onLogout }) => (
  <nav className="navbar">
    <div className="nav-container">
      <h1 className="nav-title">Procurement Platform</h1>
      {user && (
        <div className="nav-user">
          <span>Welcome, {user.name} ({user.role})</span>
          <button onClick={onLogout} className="btn btn-secondary">Logout</button>
        </div>
      )}
    </div>
  </nav>
);

export default Navbar;