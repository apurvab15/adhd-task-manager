import React from 'react'
import "./Hyperactive.css";

function Hyperactive() {
  return (
     <div className="hyperactive-container">
      <div className="tasks-section">
        <h2>My Tasks</h2>
        <div className="task-list">
          <div className="task">✅ Task 1</div>
          <div className="task">✅ Task 2</div>
          <div className="task">✅ Task 3</div>
        </div>
      </div>

      <div className="focus-section">
        <div className="focus-card">
          <button>Background Sounds</button>
          <button>Focus Timer</button>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "65%" }}></div>
        </div>
        <p>Good Progress!</p>
      </div>
    </div>
  )
}

export default Hyperactive