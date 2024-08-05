window.isActive = false;
let interactions = [];
let playwrightCode = "";
let siteUrl = "";

chrome.runtime.sendMessage({ type: "GET_TAB_URL" }, (response) => {
  siteUrl = response.url;
  playwrightCode += `await page.goto('${siteUrl}');\n`;
});

document.addEventListener("click", (event) => {
  if (!window.isActive) return;

  const target = event.target;
  highlightElement(target, interactions.length + 1);
  recordInteraction(target, "click");
  captureScreenshot();
});

document.addEventListener("change", (event) => {
  // Using 'change' instead of 'input' to get the final value
  if (!window.isActive) return;

  const target = event.target;
  highlightElement(target, interactions.length + 1);
  recordInteraction(target, "input", event.target.value);
  captureScreenshot();
});

function highlightElement(element, interactionNumber) {
  element.style.position = "relative"; // Ensure the element has position relative for absolute positioning of span
  element.style.border = "1px solid pink";
  element.style.color = "pink";

  const span = document.createElement("span");
  span.textContent = interactionNumber;
  span.style.position = "absolute";
  span.style.top = "0";
  span.style.right = "0";
  span.style.width = "20px";
  span.style.height = "20px";
  span.style.backgroundColor = "pink";
  span.style.borderRadius = "50%";
  span.style.display = "flex";
  span.style.alignItems = "center";
  span.style.justifyContent = "center";
  span.style.color = "white";
  span.style.fontSize = "12px";
  span.style.fontWeight = "bold";
  element.appendChild(span);
}

function recordInteraction(element, type, value = "") {
  const interaction = {
    id: interactions.length + 1,
    absoluteXPath: getXPath(element),
    attributes: getElementAttributes(element),
    classList: [...element.classList],
    className: element.className,
    clientHeight: element.clientHeight,
    clientWidth: element.clientWidth,
    id: element.id,
    innerHTML: element.innerHTML,
    innerText: element.innerText,
    outerHTML: element.outerHTML,
    relativeXPath: getXPath(element, document.body),
    scrollHeight: element.scrollHeight,
    scrollWidth: element.scrollWidth,
    style: element.style.cssText,
    tagName: element.tagName.toLowerCase(),
    textContent: element.textContent,
    value: value,
    x: element.getBoundingClientRect().x,
    y: element.getBoundingClientRect().y,
    type: type,
    screenshot: "",
  };
  interactions.push(interaction);

  if (type === "click") {
    playwrightCode += `await page.click('${interaction.absoluteXPath}');\n`;
  } else if (type === "input") {
    playwrightCode += `await page.fill('${interaction.absoluteXPath}', '${value}');\n`;
  }
}

function getXPath(element, root = document) {
  if (element === root) return "/";
  if (element.id !== "") return `//*[@id="${element.id}"]`;

  const parts = [];
  while (element && element !== root) {
    let index = 0;
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.nodeName === element.nodeName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${element.nodeName.toLowerCase()}[${index + 1}]`);
    element = element.parentElement;
  }
  return `/${parts.join("/")}`;
}

function getElementAttributes(element) {
  const attributes = {};
  for (let attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }
  return attributes;
}

function captureScreenshot() {
  chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" }, (response) => {
    interactions[interactions.length - 1].screenshot = response.screenshot;
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_INTERACTIONS") {
    sendResponse({ interactions });
  } else if (message.type === "GET_PLAYWRIGHT_CODE") {
    sendResponse({ playwrightCode });
  } else if (message.type === "GENERATE_HTML_REPORT") {
    const htmlReport = generateHtmlReport(interactions);
    sendResponse({ htmlReport });
  }
});

function generateHtmlReport(interactions) {
  let report = `
    <html>
      <head>
        <title>Interaction Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .interaction { margin-bottom: 20px; }
          .interaction img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; padding: 5px; }
          .interaction-id { font-size: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Interaction Report</h1>
        <p>URL: ${siteUrl}</p>
  `;

  interactions.forEach((interaction) => {
    report += `
      <div class="interaction">
        <p class="interaction-id">Step ${interaction.id}</p>
        <p>Action: ${interaction.type}</p>
        <p>XPath: ${interaction.absoluteXPath}</p>
        <p>Value: ${interaction.value}</p>
        ${
          interaction.screenshot
            ? `<img src="${interaction.screenshot}" alt="Screenshot of interaction">`
            : ""
        }
      </div>
    `;
  });

  report += `
      </body>
    </html>
  `;

  return report;
}
