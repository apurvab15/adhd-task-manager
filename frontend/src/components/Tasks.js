import React, { useEffect, useState } from 'react';

function Tasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/data.txt")
      .then((response) => response.text())
      .then((text) => {
        const lines = text.split('\n');
        const parsedTasks = lines
          .filter((line) => line.trim() !== '')
          .map((name) => ({
            name: name.trim()
          }));
        setTasks(parsedTasks);
      })
      .catch((error) => console.error('Error reading file:', error));
  }, []);

  return (
    <div className="task-list">
      {tasks.map((task, index) => (
        <div className="task-card" key={index}>
          <p>Task {index}</p>
          <p>{task.name}</p>
        </div>
      ))}
    </div>
  );
}

export default Tasks;
