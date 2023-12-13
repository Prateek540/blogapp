import { useEffect, useState } from "react";
import Post from "../Post";

const Home = () => {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch("http://localhost:8000/post")
      .then((response) => {
        response.json().then((postResponse) => {
          setPosts(postResponse);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);
  return (
    <>
      {posts.length > 0 &&
        posts.map((post) => {
          return <Post key={post._id} {...post} />;
        })}
    </>
  );
};

export default Home;
