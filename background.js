// ### Settings ###
const interval = 1; // interval in seconds

// Event-Listener für das Öffnen eines neuen Tabs
let countdownInterval;
let remainingTime;
let currentBlockListItem;

const startBlackListTimer = (blackListObj) => {
  console.log("Start countdown");
  console.log(blackListObj);
  remainingTime = blackListObj.remainingTime; // minutes to seconds
  currentBlockListItem = blackListObj;
  countdownInterval = setInterval(() => {
    remainingTime = remainingTime - interval;
    console.log(
      `Du hast heute noch ${remainingTime / 60} Minuten auf ${blackListObj.url} übrig.`,
    );
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      alert("Zeit abgelaufen!");
    }
  }, interval * 1000);
};

const stopBlackListTimer = () => {
  clearInterval(countdownInterval);
  browser.storage.local.get("blackList").then((result) => {
    const pages = result.blackList || [];
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].id === currentBlockListItem.id) {
        pages[i].remainingTime = remainingTime;
      }
    }
    console.log(pages);
    remainingTime = null;
    browser.storage.local.set({ blackList: pages });
  });
};

const checkBlackList = (page) => {
  // get black list from local storage and check if currently viewed page is on list
  browser.storage.local.get("blackList").then((result) => {
    result.blackList.forEach((element) => {
      if (page.url.toLowerCase().includes(element.url.toLowerCase())) {
        console.log("Blacklist");
        if (element.remainingTime >= 0) {
          startBlackListTimer(element);
        }
      } else {
        // TODO check if currently blocked item if true -> stop list timer and reset blockItem to null
        if (currentBlockListItem?.id) {
          stopBlackListTimer();
        }
      }
    });
  });
};

const updatePage = (page) => {
  console.log(page);
  checkBlackList(page);
  // browser.runtime.sendMessage(page)
};

// Wird ausgelöst, wenn sich der aktive Tab ändert
browser.tabs.onActivated.addListener((activeTab) => {
  // get current tab data
  browser.tabs.get(activeTab.tabId).then((tab) => {
    updatePage({
      id: tab.id,
      url: tab.url,
    });
  });
});

// TODO also handfle url change in same tab
// Tab-Änderungen überwachen
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && !tab.url.toLowerCase().includes(currentBlockListItem.url)) {
    updatePage({
      id: tabId,
      url: tab.url,
    });
  }
});

browser.storage.local.get("blackList").then((result) => {
  console.log("storage? ");
  console.log(result);
});

// TODO implement reset logic every day at 24:00

// TODO remove 
const deleteStorage = () => {
  browser.storage.local.remove("blackList").then(() => {
    console.log("Schlüssel 'blackList' wurde gelöscht.");
  });
};

// deleteStorage();
