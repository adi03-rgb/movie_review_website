import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Navbar from "./components/Navbar";
import Banner from "./components/Banner";
import Footer from "./components/Footer";
import Info from './pages/Info';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile'
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {

const router = createBrowserRouter([

  { 
    path: "/", 
    element: <div><Navbar/><About/><Footer/></div> 
  },

  { 
    path: "/about", 
    element: <div><Banner/><Navbar/><Home/><Footer/></div> 
  },

  { 
    path: "/login", 
    element: <div><Navbar/><Login/><Footer/></div> 
  },

  { 
    path: "/signup", 
    element: <div><Navbar/><Signup/><Footer/></div> 
  },

  { 
    path: "/dashboard", 
    element:<div><Banner/><Navbar/><Dashboard/><Footer/></div>
      
  },
  {
    path:"/profile",
    element:(
      <ProtectedRoute>
        <div>
          <Banner/>
          <Navbar/>
          <Profile/>
          <Footer/>
        </div>
      </ProtectedRoute>
    )
  },

  { 
    path: "/info/:mediaType/:id", 
    element: <div><Info/><Footer/></div> 
  },

  { 
    path: "/info/:info", 
    element: <div><Info/><Footer/></div> 
  }

]);

return (
  <RouterProvider router={router} />
)

}

export default App;