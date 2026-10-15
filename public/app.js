let currentUser = localStorage.getItem('vault_user') || null;

// Check if already logged in on page load
if (currentUser) {
  showDashboard();
}

async function handleAuth(type) {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msgEl = document.getElementById('auth-msg');

  if (!username || !password) {
    msgEl.style.color = '#ef4444';
    msgEl.innerText = 'Please enter both username and password.';
    return;
  }

  const endpoint = type === 'login' ? '/api/login' : '/api/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.style.color = '#ef4444';
      msgEl.innerText = data.error;
    } else {
      msgEl.style.color = '#22c55e';
      msgEl.innerText = data.message;

      if (type === 'login') {
        currentUser = data.username;
        localStorage.setItem('vault_user', currentUser);
        showDashboard();
      }
    }
  } catch (err) {
    msgEl.innerText = 'Network error occurred.';
  }
}

function showDashboard() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
  document.getElementById('user-display').innerText = currentUser;
  loadNotes();
}

function logout() {
  localStorage.removeItem('vault_user');
  currentUser = null;
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('auth-msg').innerText = '';
  document.getElementById('dashboard-section').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');
}

async function loadNotes() {
  const res = await fetch(`/api/notes/${currentUser}`);
  const notes = await res.json();
  const list = document.getElementById('notes-list');
  list.innerHTML = '';

  notes.forEach(note => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${note.text}</span>
      <button class="delete-btn" onclick="deleteNote('${note._id}')">✕</button>
    `;
    list.appendChild(li);
  });
}

async function addNote() {
  const textEl = document.getElementById('note-text');
  const text = textEl.value.trim();
  if (!text) return;

  await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: currentUser, text })
  });

  textEl.value = '';
  loadNotes();
}

async function deleteNote(id) {
  await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  loadNotes();
}