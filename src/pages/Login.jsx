import { useState } from "react";
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './Login.css'
function Login(){

 const navigate = useNavigate();

 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");

 const login = () => {
   signInWithEmailAndPassword(auth,email,password)
   .then((userCredential)=>{
       console.log("Logged in:",userCredential.user);
       navigate("/profile");  
   })
   .catch((error)=>{
       console.log(error.message);
   });
 }

 return(
   <div className="whole1">
    <div className="ex">
      <img src="/pp.gif" alt="pp" id='im1'/>
      <h1>POPTALE
      </h1>
    </div>
    <div className="log">
      <h2 className="h">Login</h2>

      <input
      className="input"
       placeholder="Username"
     />

     <input
      className="input"
       type="email"
       placeholder="Email"
       onChange={(e)=>setEmail(e.target.value)}
     />

     <input
      className="input"
       type="password"
       placeholder="Password"
       onChange={(e)=>setPassword(e.target.value)}
     />

     <button onClick={login} className="but">Login</button>

     <p style={{fontFamily: 'Inter', cursor: 'pointer'}} onClick={() => navigate("/signup")}>
          Don't have an account? Signup
        </p>
    </div>
   </div>
 )
}

export default Login;