import { app } from "./init.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { getData, drawGraph, playAnimation } from "./canvas.js";

let canvas, ctx, graphDoc, trackbar, recorder;
let animation = { data: undefined };

// Initialize Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Get document id from url
const docId = window.location.pathname.split("/")[2];

// Redirect user if not logged in
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "../";
  } else {
    document.getElementById('username').innerHTML = auth.currentUser.displayName.split(' ')[0];
    document.getElementById('profileImg').src = auth.currentUser.photoURL;
  }
});

window.onload = () => {
  document.getElementById('shareButton').onclick = () => {
    document.getElementById('sharePopup').classList.remove('hidden');
  };

  document.getElementById('shareCloseButton').onclick = () => {
    document.getElementById('sharePopup').classList.add('hidden');
  };

  document.getElementById('shareLink').textContent = `https://${window.location.host}/view/${docId}`;

  // Get canvas and context
  canvas = document.getElementById("graph");
  ctx = canvas.getContext("2d");

  document.getElementById('sign-out').onclick = () => {
    auth.signOut();
  };

  // Add expansion functionality each tab
  const tabs = ["graphTab", "animationTab", "interactionTab", "exportTab"];
  tabs.forEach(tab => {
    let headerElem = document.querySelector(`#${tab} .tabHeader`);
    headerElem.onclick = (e) => {
      e.preventDefault();
      document.querySelector(`#${tab} .tabBody`).classList.toggle("hidden");
      document.querySelector(`#${tab} .tabIcon`).classList.toggle("up");
      document.querySelector(`#${tab} .tabIcon`).classList.toggle("down");
    };

    headerElem.onmousedown = (e) => {
      e.preventDefault();
    };
  });

  const docRef = doc(db, "projects", docId);
  getDoc(docRef).then(doc => {
    if (doc.exists()) {
      graphDoc = doc.data();

      // Redirect if user is not the owner
      if (graphDoc.user !== auth.currentUser.uid) {
        window.location.href = "../signed-in.html";
        return;
      }

      // Ensure only text is entered as the project title
      let nameBox = document.getElementById("projectNameBox");
      nameBox.textContent = graphDoc.title;
      nameBox.onpaste = (e) => {
        e.preventDefault();
      };
      nameBox.ondrop = (e) => {
        e.preventDefault();
      };

      // Save project title on change
      nameBox.oninput = (e) => {
        nameBox.textContent = nameBox.textContent.replace(/(\r\n|\n|\r)/gm, "");
        graphDoc.title = nameBox.textContent;
        updateDoc(docRef, { title: graphDoc.title });
      };

      let headers = [...new Set(graphDoc.header)];

      function setOptionDropdown(el, key) {
        // Add each column header as an option
        headers.forEach(header => {
          el.add(new Option(header, header));
        });

        // Retrieve and set the saved value
        if (key in graphDoc) {
          el.value = graphDoc[key];
        }

        el.onchange = (e) => {
          // Save new value to the database
          graphDoc[key] = el.value;
          updateDoc(docRef, { [key]: graphDoc[key], incr: deleteField() });
          delete graphDoc.incr;

          // Redraw the graph
          graphDoc.dataToDraw = getData(graphDoc, trackbar);
          if (animDropdown.value !== "") {
            drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
          } else {
            drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw);
          }
        };
      }

      let animDropdown = document.getElementById("animDropdown");
      // Add functionality to common dropdowns
      setOptionDropdown(document.getElementById("xDropdown"), 'x');
      setOptionDropdown(document.getElementById("yDropdown"), 'y');
      setOptionDropdown(animDropdown, 'anim');

      // Retrieve and save animation format options
      let animFormatBox = document.getElementById("animFormatDropdown");
      if ('animFormat' in graphDoc) {
        animFormatBox.value = graphDoc.animFormat;
      } else {
        graphDoc.animFormat = 'number';
      }
      animFormatBox.onchange = (e) => {
        graphDoc.animFormat = animFormatBox.value;
        updateDoc(docRef, { animFormat: graphDoc.animFormat });
        if (animDropdown.value !== "") {
          drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
        } else {
          drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw);
        }
      };

      // Retrieve and save bar-click options
      let barClickBox = document.getElementById("barClickDropdown");
      if ('barClick' in graphDoc) {
        barClickBox.value = graphDoc.barClick;
      } else {
        graphDoc.barClick = '';
      }
      barClickBox.onchange = (e) => {
        graphDoc.barClick = barClickBox.value;
        updateDoc(docRef, { barClick: graphDoc.barClick });
        if (animDropdown.value !== "") {
          drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
        } else {
          drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw);
        }
      };

      // Show/hide animation controls
      let animControls = document.getElementById("animationControls");
      if (animDropdown.value !== "") {
        animControls.classList.remove("hidden");
      }
      animDropdown.addEventListener("change", (e) => {
        if (animDropdown.value === "") {
          animControls.classList.add("hidden");
        } else {
          animControls.classList.remove("hidden");
        }
      });

      trackbar = document.getElementById("trackbar");
      trackbar.oninput = (e) => {
        drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, e.target.value);
      };

      // Play/pause animation
      let playButton = document.getElementById("playButton");
      playButton.onclick = () => {
        console.log(animation);
        if (animation.data) {
          playButton.classList.remove("pause");
          animation.data = window.cancelAnimationFrame(animation.data);
        } else {
          playButton.classList.add("pause");
          playAnimation(canvas, ctx, graphDoc, trackbar, animation, recorder);
        }
      }

      // Download image
      document.getElementById("imageButton").onclick = () => {
        let data = canvas.toDataURL("image/png");
        let link = document.createElement("a");
        link.download = "graph.png";
        link.href = data;
        link.click();
      };

      recorder = new MediaRecorder(canvas.captureStream());

      // Store all recorded data in an array
      let videoChunks = [];
      recorder.ondataavailable = (e) => {
        videoChunks.push(e.data);
      }

      // Download the recorded data when the recorder stops
      recorder.onstop = (e) => {
        let blob = new Blob(videoChunks, { type: "video/webm" });
        videoChunks = [];
        let url = URL.createObjectURL(blob);
        let link = document.createElement("a");
        link.download = "graph.webm";
        link.href = url;
        link.click();
      }

      document.getElementById("videoButton").onclick = () => {
        // Reset any current animataion
        trackbar.value = 0;
        playButton.classList.remove("pause");
        animation.data = window.cancelAnimationFrame(animation.data);
        drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);

        // Start the recorder
        recorder.start();
        playAnimation(canvas, ctx, graphDoc, trackbar, animation, recorder);
      };

      // Draw initial frame
      graphDoc.barPos = {};
      graphDoc.clickedBar = undefined;
      graphDoc.dataToDraw = getData(graphDoc, trackbar);
      if (animDropdown.value !== "") {
        drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
      } else {
        drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw);
      }

      // Set selected bar when clicked
      canvas.onclick = (e) => {
        if (graphDoc.barClick !== "") {
          let x = e.offsetX;
          let y = e.offsetY;

          // Find which bar was clicked
          graphDoc.clickedBar = Object.keys(graphDoc.barPos).find(key => x >= graphDoc.barPos[key].x
            && y <= graphDoc.barPos[key].y
            && x <= graphDoc.barPos[key].x + graphDoc.barPos[key].width
            && y >= graphDoc.barPos[key].y + graphDoc.barPos[key].height);

          if (animDropdown.value !== "") {
            drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
          } else {
            drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw);
          }
        }
      }
    } else {
      console.log("No such document!");
    }
  });
};