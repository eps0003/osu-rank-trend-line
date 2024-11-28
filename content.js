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
  return `M0,0 L0,${height} L${width},${height} L${width},0 L0,0`;
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
