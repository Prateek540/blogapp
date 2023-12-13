import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";

const Header = () => {
  const { setUserInfo, userInfo } = useContext(UserContext);
  useEffect(() => {
    fetch("http://localhost:8000/profile", { credentials: "include" }).then(
      (response) =>
        response.json().then((userInfo) => {
          setUserInfo(userInfo);
        })
    );
  }, [setUserInfo]);

  const logoutHandler = () => {
    fetch("http://localhost:8000/logout", {
      credentials: "include",
      method: "POST",
    });
    setUserInfo(null);
  };

  return (
    <header>
      <Link to="/" className="logo">
        BlogApp
      </Link>
      <nav>
        {userInfo && (
          <>
            <Link to="/create">Create New Post</Link>
            <Link onClick={logoutHandler}>Logout</Link>
          </>
        )}
        {!userInfo && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
