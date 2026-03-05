// main function
document.addEventListener("DOMContentLoaded", async () => {
  // TODO remove
  // display current tab
  let currentTab = await getCurrentTab();
  console.log(currentTab);
  const tabInfoElement = document.getElementById("tab-info");
  tabInfoElement.innerHTML = `
            <p>${currentTab.title}</p>
        `;
  const res = await requestCurrentBlackListData();
  console.log(res);
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
  const sending = browser.runtime.sendMessage({ msg: "getBlackListItem" });
  sending
    .then((response) => {
      console.log(response);
      return response;
    })
    .catch((err) => {
      console.error(err);
    });
};
