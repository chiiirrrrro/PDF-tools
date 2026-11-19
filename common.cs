body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  margin: 1em;
  background: #f9f9f9;
  color: #222;
  line-height: 1.4;
}

h1 {
  font-size: 1.4rem;
  margin-bottom: 0.5em;
}

select,
input[type="number"],
input[type="text"] {
  padding: 4px 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 0.9rem;
}

button {
  font-size: 0.95rem;
  padding: 6px 12px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  background: #1976d2;
  color: white;
  transition: background-color 0.3s;
  margin-top: 8px;
}

button:hover {
  background: #0d47a1;
}

button.secondary-btn {
  background: #455a64;
}

button.secondary-btn:hover {
  background: #263238;
}

#progress-container {
  width: 100%;
  max-width: 600px;
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 10px 0;
  height: 20px;
}

#progress-bar {
  width: 0%;
  height: 100%;
  background: #4caf50;
  border-radius: 8px;
  transition: width 0.2s;
}

#status {
  font-weight: 500;
  margin-bottom: 10px;
}

label {
  display: block;
  margin: 10px 0 6px;
  font-weight: 600;
}

.option-setting {
  margin: 15px 0;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 8px;
  display: inline-block;
}
