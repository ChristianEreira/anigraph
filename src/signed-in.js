import { app } from "./init.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// Initialize Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Get server Cloud Function
const functions = getFunctions(app, 'europe-west3');
const uploadCsv = httpsCallable(functions, 'uploadCsv');

// Redirect user if not logged in
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "./";
  } else {
    document.getElementById('username').innerHTML = auth.currentUser.displayName.split(' ')[0];
    document.getElementById('profileImg').src = auth.currentUser.photoURL;

    // Get user's projects
    const projects = collection(db, 'projects');
    const q = query(projects, where('user', '==', auth.currentUser.uid));
    getDocs(q).then(docs => {
      const projectList = document.getElementById('projectList');
      if (docs.size === 0) {
        projectList.innerHTML = '<p>No projects</p>';
      } else {
        // Display each project
        docs.forEach(doc => {
          const project = doc.data();

          const projectEl = document.createElement('a');
          projectEl.href = 'edit/' + doc.id;
          projectEl.innerHTML = `
          <div class="project">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Blue_bar_graph.png">
              <h3>${project.title}</h3>
          </div>
          `;
          projectList.appendChild(projectEl);
        });
      }
    });
  }
});

window.onload = () => {
  document.getElementById('sign-out').onclick = () => {
    auth.signOut();
  };

  document.getElementById('createGraphButton').onclick = () => {
    document.getElementById('createGraphPopup').classList.remove('hidden');
  };

  document.getElementById('createGraphCloseButton').onclick = () => {
    document.getElementById('createGraphPopup').classList.add('hidden');
  };

  document.getElementById('csvUpload').onclick = () => {
    document.getElementById('csvFile').click();
  };

  document.getElementById('csvUpload').ondragover = dragEnter;
  document.getElementById('csvUpload').ondragenter = dragEnter;
  document.getElementById('csvUpload').ondragleave = dragLeave;

  // Upload file when dropped
  document.getElementById('csvUpload').ondrop = (e) => {
    dragLeave(e);
    uploadFile(e.dataTransfer.files[0]);
  };

  // Upload file when selected
  document.getElementById('csvFile').onchange = () => {
    uploadFile(document.getElementById('csvFile').files[0]);
  };
};

function showError(error) {
  alert(error);
}

function uploadFile(file) {
  if (file.type !== 'text/csv') {
    showError('Not a CSV file');
  } else if (file.size > 10485760) {
    showError('File too large');
  } else {
    // Display loading information
    document.getElementById('csvFilename').innerHTML = file.name;
    document.getElementById('csvUploadStatus').classList.remove('hidden');
    document.getElementById('csvUpload').classList.add('hidden');
    document.getElementById('samplePrompt').classList.add('hidden');
    document.getElementById('createGraphCloseButton').classList.add('hidden');

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      // Upload file data to server to create new project
      uploadCsv(reader.result).then((result) => {
        // Redirect to new project's edit page
        window.location.href = "edit/" + result.data;
      }).catch(() => {
        // Upload failed...
        // Reset upload UI and show error
        document.getElementById('csvUploadStatus').classList.add('hidden');
        document.getElementById('csvUpload').classList.remove('hidden');
        document.getElementById('samplePrompt').classList.remove('hidden');
        document.getElementById('createGraphCloseButton').classList.remove('hidden');
        showError('Couldn\'t process CSV file');
      });
    });
    // Read data from selected file
    reader.readAsText(file);
  }
}

function dragEnter(e) {
  e.stopPropagation();
  e.preventDefault();
  document.getElementById('csvUpload').classList.add('dragging');
}

function dragLeave(e) {
  e.stopPropagation();
  e.preventDefault();
  document.getElementById('csvUpload').classList.remove('dragging');
}