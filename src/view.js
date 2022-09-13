import { app } from "./init.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getData, drawGraph, playAnimation } from "./canvas.js";

let canvas, ctx, graphDoc, trackbar;
let animation = { data: undefined };

// Initialize Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Get document id from url
const docId = window.location.pathname.split("/")[2];

window.onload = () => {
  // Get canvas and context
  canvas = document.getElementById("graph");
  ctx = canvas.getContext("2d");

  const docRef = doc(db, "projects", docId);
  getDoc(docRef).then(doc => {
    if (doc.exists()) {
      graphDoc = doc.data();

      document.getElementById("projectName").textContent = graphDoc.title;

      let headers = [...new Set(graphDoc.header)];

      let animControls = document.getElementById("animationControls");
      if ('anim' in graphDoc && graphDoc.anim !== "") {
        animControls.classList.remove("hidden");
      }

      trackbar = document.getElementById("trackbar");
      trackbar.oninput = (e) => {
        drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, e.target.value);
      };

      let playButton = document.getElementById("playButton");
      playButton.onclick = () => {
        console.log(animation);
        if (animation.data) {
          playButton.classList.remove("pause");
          animation.data = window.cancelAnimationFrame(animation.data);
        } else {
          playButton.classList.add("pause");
          playAnimation(canvas, ctx, graphDoc, trackbar, animation);
        }
      }

      graphDoc.barPos = {};
      graphDoc.clickedBar = undefined;
      graphDoc.dataToDraw = getData(graphDoc, trackbar);
      if ('anim' in graphDoc && graphDoc.anim !== "") {
        drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
      } else {
        drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw);
      }

      canvas.onclick = (e) => {
        let x = e.offsetX;
        let y = e.offsetY;

        // Find which bar was clicked
        graphDoc.clickedBar = Object.keys(graphDoc.barPos).find(key => x >= graphDoc.barPos[key].x
          && y <= graphDoc.barPos[key].y
          && x <= graphDoc.barPos[key].x + graphDoc.barPos[key].width
          && y >= graphDoc.barPos[key].y + graphDoc.barPos[key].height);

        if ('anim' in graphDoc && graphDoc.anim !== "") {
          drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
        } else {
          drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw);
        }
      }
    } else {
      console.log("No such document!");
    }
  });
};