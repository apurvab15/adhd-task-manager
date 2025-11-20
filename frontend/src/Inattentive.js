import React from 'react'
import "./Inattentive.css";
import Tasks from './components/Tasks';
function Inattentive() {
  return (
    <div className="inattentive-container">
      <div className="header-buttons">
        <button className="small-btn">Add Tasks</button>
        <button className="small-btn">Focus/Explore</button>
      </div>

      <button className="main-btn">START A NEW PROJECT</button>

      <div className="task-cards">
        <Tasks/>
      </div>

      <p className="summary-text">Time Spent - 30 Hours &nbsp; 55XP Gained</p>
      <p className="summary-text">Good Work!</p>

      <button className="calm-btn">Need to calm down?</button>
    </div>
  )
}

export default Inattentive