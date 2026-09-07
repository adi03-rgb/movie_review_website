import React from 'react'
import {Link} from 'react-router-dom'
import "./Footer.css"
const Footer = () => {
  return (
    <div className='foot'>
        <ul id='u1'>
            <div>Home:<Link to="/">Want to know about the website? click to see more</Link></div>
            <div><Link to="/about"></Link></div>
           <div> Dashboard:<Link to="/dashboard">Search your movie to know all its details </Link></div>
        </ul>
      <p>@copy-right Poptale</p>
    </div>
  )
}

export default Footer
