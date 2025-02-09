const API_URL = "http://localhost:3000/api";
let token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
    if (token) {
        showTasks();
    }
});

async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    document.getElementById("authMessage").textContent = data.error || data.message;
}

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    
    if (data.token) {
        localStorage.setItem("token", data.token);
        token = data.token;
        showTasks();
    } else {
        document.getElementById("authMessage").textContent = data.error;
    }
}

function logout() {
    localStorage.removeItem("token");
    token = null;
    document.getElementById("authSection").style.display = "block";
    document.getElementById("taskSection").style.display = "none";
}

async function showTasks() {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("taskSection").style.display = "block";
    fetchTasks();
}

async function fetchTasks() {
    const res = await fetch(`${API_URL}/tasks`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const tasks = await res.json();
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.className = task.completed ? "completed" : "";
        li.innerHTML = `
            <span onclick="toggleTask('${task._id}', ${task.completed})">${task.title}</span>
            <button class="delete-btn" onclick="deleteTask('${task._id}')">❌</button>
        `;
        taskList.appendChild(li);
    });
}

async function addTask() {
    const taskInput = document.getElementById("taskInput");
    if (!taskInput.value.trim()) return;

    await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: taskInput.value })
    });

    taskInput.value = "";
    fetchTasks();
}

async function toggleTask(id, completed) {
    await fetch(`${API_URL}/tasks/${id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ completed: !completed })
    });
    fetchTasks();
}

async function deleteTask(id) {
    await fetch(`${API_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    fetchTasks();
}
