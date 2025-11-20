import React, { useState } from "react";
import './App.css';
import Inattentive from './Inattentive';
import Hyperactive from './Hyperactive';

function App() {
  const [ui_selector, setui_selector] = useState(0);

  function render_ui(){
    if(ui_selector%2 === 0)
    {
      return <Inattentive/>
    }
    else {
      return <Hyperactive/>
    }
  }

  function change_layout() {
    setui_selector(ui_selector+1);
  }

  return (
    <div className="App">
      <button onClick={change_layout}>Change Layout Manually</button>
      {render_ui()}
    </div>
  );
}

export default App;
