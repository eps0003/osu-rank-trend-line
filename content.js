console.log("osu! Rank Trend Line is active");

const mutationObserver = new MutationObserver(() => {
  const element = document.querySelector(
    ".profile-detail__chart .line-chart__line"
  );
  if (element && !element.classList.contains("trend-added")) {
    element.classList.add("trend-added");
    const clonedElement = element.cloneNode(true);
    clonedElement.setAttribute("stroke-dasharray", "8 4");
    element.insertAdjacentElement("beforebegin", clonedElement);
  }

  const hoverElements = document.querySelectorAll(
    ".profile-detail__chart .line-chart__hover-area"
  );
  for (const element of hoverElements) {
    resizeObserver.observe(element);
  }

  const container = document.querySelector(".profile-detail__values");
  if (container && !container.classList.contains("projected")) {
    const rankEstimate = denormalizeRankEstimation(60);
    const formattedRankEstimate =
      rankEstimate !== null
        ? `#${Math.round(rankEstimate).toLocaleString()}`
        : "-";

    container.classList.add("projected");
    container.lastChild.insertAdjacentHTML(
      "afterend",
      `<div class="value-display value-display--rank">
          <div class="value-display__label">Projected Ranking (60d)</div>
          <div class="value-display__value">
            <div data-html-title="">
              ${formattedRankEstimate}
            </div>
          </div>
        </div>`
    );
  }
});

mutationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const width = entry.contentRect.width;
    const height = entry.contentRect.height;

    if (!width || !height) {
      return;
    }

    const dataset = normalizeArray(getRankHistory());
    const { slope } = linearRegressionNormalized(dataset);

    const element = entry.target.previousElementSibling.firstChild.firstChild;
    element.setAttribute("d", getPath(width, height));

    if (slope > 0) {
      element.classList.remove("positive-trend");
      element.classList.add("negative-trend");
    } else {
      element.classList.remove("negative-trend");
      element.classList.add("positive-trend");
    }
  });
});

/**
 * @param {number[]} arr
 * @returns {number[]}
 */
function normalizeArray(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);

  if (min === max) {
    return arr.map(() => 0.5);
  }

  return arr.map((x) => (x - min) / (max - min));
}

/**
 * @param {number[]} y
 * @returns {{ slope: number, intercept: number }}
 */
function linearRegressionNormalized(y) {
  const n = y.length;
  const x = Array.from({ length: n }, (_, i) => i / (n - 1)); // Normalized x
  const xMean = 0.5; // Fixed mean of normalized x
  const yMean = y.reduce((sum, yi) => sum + yi, 0) / n;

  // Covariance of x and y
  const numerator = y.reduce(
    (sum, yi, i) => sum + (x[i] - xMean) * (yi - yMean),
    0
  );

  // Variance of x (normalized range)
  const denominator = x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

/**
 * @param {number} day
 * @returns {number | null}
 */
function denormalizeRankEstimation(day) {
  const ranks = getRankHistory();
  if (!ranks) {
    return null;
  }

  const min = Math.min(...ranks);
  const max = Math.max(...ranks);
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const logRange = logMax - logMin;

  const dataset = normalizeArray(ranks);
  const { slope, intercept } = linearRegressionNormalized(dataset);

  const x = (ranks.length + day) / ranks.length;

  const yProj = slope * x + intercept;
  const scaledLog = logMin + yProj * logRange;

  return Math.max(Math.exp(scaledLog), 1);
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function getPath(width, height) {
  const dataset = normalizeArray(getRankHistory());
  const { slope, intercept } = linearRegressionNormalized(dataset);

  const y0 = intercept * height;
  const y1 = (slope + intercept) * height;

  return `M0,${y0} L${width},${y1}`;

  return `M0,0 L0,${height} L${width},${height} L${width},0 L0,0`;
}

/**
 * @returns {number[]}
 */
function getRankHistory() {
  const dataString = document
    .querySelector(".osu-layout__section .js-react.u-contents")
    ?.getAttribute("data-initial-data");
  if (!dataString) {
    return null;
  }

  /** @type {number[]} */
  const data = JSON.parse(dataString).user.rank_history.data;
  if (data.some((rank) => rank === 0)) {
    return null;
  }

  return data;
}

function appendStyle() {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .positive-trend {
      stroke: hsl(var(--hsl-lime-1)) !important;
      stroke-width: 1px !important;
    }
    .negative-trend {
      stroke: hsl(var(--hsl-red-1)) !important;
      stroke-width: 1px !important;
    }
  `;
  document.head.appendChild(styleElement);
}

appendStyle();
