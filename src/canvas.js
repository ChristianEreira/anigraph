// Organise data to be drawn and calculate incrememt
export function getData(graphDoc, trackbar) {
  let dataToDraw;
  // ANIMATED
  if ('anim' in graphDoc && graphDoc.anim !== "") {
    let uniqueX = [... new Set(graphDoc.data.map(record => record[graphDoc.x]))];
    graphDoc.uniqueAnim = [... new Set(graphDoc.data.map(record => record[graphDoc.anim]))];
    // For each animation frame, find numeric y values for each unique x value
    dataToDraw = graphDoc.uniqueAnim.map(anim => {
      return {
        frame: anim, data: uniqueX.map(x => {
          let y = graphDoc.data.filter(record => record[graphDoc.x] === x && record[graphDoc.anim] === anim).pop();
          if (y) {
            let yNum = parseFloat(y[graphDoc.y]);
            if (!isNaN(yNum)) {
              return { x: x, y: yNum };
            }
          }
          return null;
        }).filter(record => record !== null)
      };
    });

    trackbar.max = graphDoc.uniqueAnim.length - 1;
  } else {
    // STATIC
    let uniqueX = [... new Set(graphDoc.data.map(record => record[graphDoc.x]))];
    // For each unique x, find a numeric y value
    dataToDraw = uniqueX.map(x => {
      let y = graphDoc.data.filter(record => record[graphDoc.x] === x).pop();
      if (y) {
        let yNum = parseFloat(y[graphDoc.y]);
        if (!isNaN(yNum)) {
          return { x: x, y: yNum };
        }
      }
      return null;
    }).filter(record => record !== null);
  }

  // Calculate scale increments
  if (!('incr' in graphDoc)) {
    // Find the maximum y value
    let maxVal;
    if ('anim' in graphDoc && graphDoc.anim !== "") {
      maxVal = Math.max(...[].concat(...dataToDraw.map(timeFrame => timeFrame.data.map(record => record.y))));
    } else {
      maxVal = Math.max(...dataToDraw.map(record => record.y));
    }

    // Divide by number of desired increments (10)
    let tempInc = Math.ceil(maxVal / 10);
    let numDigits = tempInc.toString().length;
    
    // Round up to a 'nice' number
    if (tempInc >= 50) {
      tempInc = Math.ceil(tempInc / Math.pow(10, numDigits - 1)) * Math.pow(10, numDigits - 1);
    } else if (tempInc >= 5) {
      tempInc = Math.ceil(tempInc / 5) * 5;
    }

    graphDoc.maxVal = maxVal;
    graphDoc.incr = tempInc;
  }

  return dataToDraw;
}

// Draw the graph to the canvas
export function drawGraph(canvas, ctx, graphDoc, data, anim = false) {
  let canvasSize = { x: 800, y: 500 };
  let margin = { left: 64, right: 64, top: 64, bottom: 64 };

  // Fix blurry lines
  canvas.style.width = canvasSize.x + "px";
  canvas.style.height = canvasSize.y + "px";
  let dpi = window.devicePixelRatio;
  canvas.width = canvasSize.x * dpi;
  canvas.height = canvasSize.y * dpi;
  ctx.scale(dpi, dpi);
  ctx.translate(0.5, 0.5);

  // Clear canvas
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  if (anim) {
    data = data.find(record => record.frame === graphDoc.uniqueAnim[anim]).data;
  }

  ctx.textBaseline = "middle";
  ctx.fillStyle = "#333333";

  // Ensure there is data to draw
  let errorText;
  if (graphDoc.x == "" || !('x' in graphDoc) || graphDoc.y == "" || !('y' in graphDoc)) {
    errorText = "Please select X and Y axis variables.";
  } else if (data.length === 0) {
    errorText = "No data to display.\n\nPlease ensure that the selected y axis\nvariable contains numeric data.";
  }

  if (errorText) {
    // Display error message
    ctx.font = "italic 16px Poppins";
    ctx.textAlign = "center";
    let errorLine = errorText.split("\n");
    errorLine.forEach((line, i) => {
      ctx.fillText(line, canvasSize.x / 2, (canvasSize.y / 2) + ((i - ((errorLine.length - 1) / 2)) * 24));
    });
  } else {
    let scale = graphDoc.incr * Math.ceil(graphDoc.maxVal / graphDoc.incr);

    ctx.font = "12px Poppins";
    ctx.textAlign = "right";

    // gridline overlap + labels + label margin
    margin.left += 8 + ctx.measureText(scale).width + 4;
    margin.bottom += 12 + 8;
    if (anim) {
      margin.bottom += 32;
    }

    // Draw grid lines and y labels
    ctx.strokeStyle = "#cccccc";
    let pxIncr = (canvasSize.y - (margin.top + margin.bottom)) / (scale / graphDoc.incr);
    for (let i = 0; i <= (scale / graphDoc.incr); i += 1) {
      ctx.beginPath();
      ctx.moveTo(margin.left - 8, (pxIncr * i) + margin.top);
      ctx.lineTo(canvasSize.x - margin.right, (pxIncr * i) + margin.top);
      ctx.stroke();

      ctx.fillText(graphDoc.incr * ((scale / graphDoc.incr) - i), margin.left - 12, (pxIncr * i) + margin.top);
    }

    // Draw bars and x labels
    let dataLabel = {};
    graphDoc.barPos = {};
    let barLength = 2 * ((canvasSize.x - (margin.left + margin.right))) / ((3 * data.length) + 1);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    data.forEach((record, index) => {
      ctx.fillStyle = '#3661EB';
      // Fade current bar if another is highlighted
      if (graphDoc.barClick == 'highlight' && record.x !== graphDoc.clickedBar && graphDoc.clickedBar !== undefined) {
        ctx.globalAlpha = 0.3;
      }

      let x = margin.left + (barLength / 2) + (1.5 * barLength * index);
      // Draw bar
      ctx.fillRect(x, canvasSize.y - margin.bottom, barLength, -(canvasSize.y - (margin.top + margin.bottom)) * (record.y / scale));
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'black';
      // Draw x label
      ctx.fillText(record.x, x + (barLength / 2), canvasSize.y - margin.bottom + 8);
      
      graphDoc.barPos[record.x] = { x: x, y: canvasSize.y - margin.bottom, width: barLength, height: -(canvasSize.y - (margin.top + margin.bottom)) * (record.y / scale) };

      if (graphDoc.clickedBar == record.x) {
        dataLabel = {value: record.y, x: x + (barLength / 2), y: (canvasSize.y - margin.bottom) + (-(canvasSize.y - (margin.top + margin.bottom)) * (record.y / scale))};
      }
    });

    ctx.fillStyle = 'black';

    // Draw animation frame label
    if (anim) {
      ctx.font = "16px Poppins";
      let animLabel;
      switch (graphDoc.animFormat) {
        case "number":
          animLabel = graphDoc.uniqueAnim[anim];
          break;
        case "y":
          animLabel = new Date(graphDoc.uniqueAnim[anim]).toLocaleDateString("en-GB", { year: "numeric" });
          break;
        case "my":
          animLabel = new Date(graphDoc.uniqueAnim[anim]).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
          break;
        case "dmy":
          animLabel = new Date(graphDoc.uniqueAnim[anim]).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
          break;
      }
      ctx.fillText(animLabel, canvasSize.x / 2, canvasSize.y - margin.bottom + 36);
    }

    // draw axis
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(margin.left, canvasSize.y - margin.bottom);
    ctx.lineTo(canvasSize.x - margin.right, canvasSize.y - margin.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, canvasSize.y - margin.bottom);
    ctx.stroke();

    // Draw data label on selected bar
    if (graphDoc.barClick == 'value' && graphDoc.clickedBar !== undefined) {
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'white';
      ctx.font = "12px Poppins";
      let labelWidth = ctx.measureText(dataLabel.value).width;
      ctx.strokeRect((dataLabel.x - (labelWidth / 2)) - 8, ((dataLabel.y - 8) - 12) - 8, labelWidth + 16, 12 + 8);
      ctx.fillRect((dataLabel.x - (labelWidth / 2)) - 8, ((dataLabel.y - 8) - 12) - 8, labelWidth + 16, 12 + 8);
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = 'black';
      ctx.fillText(dataLabel.value, dataLabel.x, (dataLabel.y - 8) - 4);
    }
  }
}

export function playAnimation(canvas, ctx, graphDoc, trackbar, animation, recorder = undefined) {
  trackbar.value = parseInt(trackbar.value) + 1;
  drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);

  if (trackbar.value == graphDoc.uniqueAnim.length - 1) {
    // animation has finished
    trackbar.value = 0;
    if (typeof recorder !== 'undefined' && recorder.state == "recording") {
      // Stop recording and re-draw first frame
      recorder.stop();
      window.cancelAnimationFrame(animation.data);
      drawGraph(canvas, ctx, graphDoc, graphDoc.dataToDraw, trackbar.value);
      return;
    }
  }

  animation.data = window.requestAnimationFrame(() => playAnimation(canvas, ctx, graphDoc, trackbar, animation, recorder));
}