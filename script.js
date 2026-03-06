// main function
document.addEventListener("DOMContentLoaded", async () => {
  // TODO remove
  // display current tab
  let currentTab = await getCurrentTab();
  console.log(currentTab);
  const tabInfoElement = document.getElementById("tab-info");
  const blackListItemEl = document.getElementById("black-list-item");

  tabInfoElement.innerHTML = `
            <p>${currentTab.title}</p>
        `;
  const res = await requestCurrentBlackListData();
  console.log(res);
  if (res) {
    blackListItemEl.innerHTML = `
        <p>${formatTime(res.remainingTime)}</p>
    `;
    let remainingTime = res.remainingTime;

    const updateInterval = setInterval(() => {
      remainingTime--;
      blackListItemEl.innerHTML = `
        <p>${formatTime(remainingTime)}</p>
    `;
      if (remainingTime <= 0) {
        clearInterval(updateInterval);
      }
    }, 1000);
  }
});

// elements
const saveButton = document.getElementById("saveButton");
const pageInput = document.getElementById("page");

// Daten zur Liste hinzufügen
saveButton.addEventListener("click", () => {
  const newPage = {
    id: crypto.randomUUID(),
    url: pageInput.value.trim(),
    allowedDuration: 60 * 60,
    remainingTime: 60 * 60,
  };
  if (!newPage) {
    alert("Bitte geben Sie eine Seite ein!");
    return;
  }

  browser.storage.local.get("blackList").then((result) => {
    const pages = result.blackList || [];
    pages.push(newPage);

    browser.storage.local.set({ blackList: pages }).then(() => {
      pageInput.value = "";
    });
  });
});

const getCurrentTab = async () => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs && tabs.length > 0) {
      const currentTab = tabs[0];
      return currentTab;
    } else {
      console.error("Kein aktiver Tab gefunden.");
    }
  } catch (error) {
    console.error("Fehler beim Abrufen des Tabs:", error);
  }
};

// ## add current page to delete list ##
const addCurrentPageToList = () => {};

const requestCurrentBlackListData = async () => {
  try {
    const res = await browser.runtime.sendMessage({ msg: "getBlackListItem" });
    return res;
  } catch (err) {
    console.error(err);
  }
};

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = secs.toString().padStart(2, "0");

  // format "h:mm:ss"
  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}
