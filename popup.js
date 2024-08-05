document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleButton");
  const statusSpan = document.getElementById("status");
  const downloadInteractionsButton = document.getElementById(
    "downloadInteractions"
  );
  const downloadPlaywrightCodeButton = document.getElementById(
    "downloadPlaywrightCode"
  );
  const downloadHtmlReportButton =
    document.getElementById("downloadHtmlReport");

  toggleButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "TOGGLE_ACTIVE" }, (response) => {
      const isActive = response.isActive;
      statusSpan.textContent = isActive ? "Activo" : "Inactivo";
      toggleButton.textContent = isActive ? "Apagar" : "Encender";
    });
  });

  downloadInteractionsButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "GET_INTERACTIONS" },
        (response) => {
          const data = JSON.stringify(response.interactions, null, 2);
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_DATA",
            data: data,
            filename: "interactions.txt",
          });
        }
      );
    });
  });

  downloadPlaywrightCodeButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "GET_PLAYWRIGHT_CODE" },
        (response) => {
          const data = response.playwrightCode;
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_DATA",
            data: data,
            filename: "playwrightCode.js",
          });
        }
      );
    });
  });

  downloadHtmlReportButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "GENERATE_HTML_REPORT" },
        (response) => {
          const data = response.htmlReport;
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_HTML_REPORT",
            data: data,
            filename: "report.html",
          });
        }
      );
    });
  });
});
