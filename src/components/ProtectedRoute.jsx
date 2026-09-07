import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from '../services/firebase';
import { onAuthStateChanged } from "firebase/auth";

function ProtectedRoute({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setLoading(false);
  });

  return () => unsubscribe();
}, []);

if (loading) {
  return <div>Loading...</div>;
}

return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;