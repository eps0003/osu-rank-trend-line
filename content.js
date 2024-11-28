console.log("Hello World!");

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === 1 &&
          node.classList.contains("line-chart__line") &&
          !node.classList.contains("line-chart__line-trend")
        ) {
          resizeObserver.observe(node);
          duplicateElement(node);
        }
      });
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const width = entry.contentRect.width;
    const height = entry.contentRect.height;

    console.log(`New width: ${width}px, New height: ${height}px`);

    entry.target.previousElementSibling.setAttribute(
      "d",
      getPath(width, height)
    );
  });
});

function duplicateElement(element) {
  const clonedElement = element.cloneNode(true);
  clonedElement.classList.add("line-chart__line-trend");
  element.parentNode.prepend(clonedElement);
}

function getPath(width, height) {
  const rankHistory = getRankHistory();

  const logScaleY = rankHistory.map((rank) => Math.log10(rank));

  const maxLogY = Math.max(...logScaleY);
  const minLogY = Math.min(...logScaleY);

  function mapToSVGCoordinates(index, value) {
    // Map x to the index of the dataset (spaced evenly along the width)
    const x = (index / (rankHistory.length - 1)) * width;

    // Map y to the log-transformed value, scaled to fit the SVG height
    const y = ((Math.log10(value) - minLogY) / (maxLogY - minLogY)) * height;

    return { x, y };
  }

  // Create the path data for the trend line
  let pathData = "";

  rankHistory.forEach((value, index) => {
    const { x, y } = mapToSVGCoordinates(index, value);
    pathData += (index === 0 ? "M" : "L") + `${x},${y} `;
  });

  return pathData.trim();

  return `M0,0 L0,${height} L${width},${height} L${width},0 L0,0`;
}

function getRankHistory() {
  const dataString = document
    .getElementsByClassName("js-react--profile-page u-contents")[0]
    .getAttribute("data-initial-data");
  return JSON.parse(dataString).user.rank_history.data;
}

function appendStyle() {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .line-chart__line-trend {
      stroke: hsl(var(--hsl-red-1)) !important;
    }
  `;
  document.head.appendChild(styleElement);
}

appendStyle();

console.log(getRankHistory());
