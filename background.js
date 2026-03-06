// ### Settings ###
const interval = 5; // interval in seconds

let countdownInterval;
let remainingTime;
let currentBlockListItem;

const startBlackListTimer = (blackListObj) => {
  clearInterval(countdownInterval); // clear interval if still running
  remainingTime = blackListObj.remainingTime;
  currentBlockListItem = blackListObj;

  // start countdown interval
  countdownInterval = setInterval(() => {
    remainingTime = remainingTime - interval;
    console.log(
      `Du hast heute noch ${remainingTime} Sekunden auf ${blackListObj.url} übrig.`,
    );
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
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
    browser.storage.local.set({ blackList: pages });
    currentBlockListItem = null;
  });
};

const checkBlackList = (page) => {
  // get black list from local storage and check if currently viewed page is on list
  browser.storage.local.get("blackList").then((result) => {
    if (!result.blackList) return;

    const matchedItem = result.blackList.find((element) =>
      page.url.toLowerCase().includes(element.url.toLowerCase()),
    );

    if (matchedItem) {
      if (matchedItem.remainingTime >= 0) {
        // only restart time if changed to different black list page
        if (currentBlockListItem?.id !== matchedItem.id) {
          startBlackListTimer(matchedItem);
        }
      }
    } else {
      // no match
      if (currentBlockListItem?.id) {
        stopBlackListTimer();
      }
    }
  });
};

const updatePage = (page) => {
  checkBlackList(page);
};

// watch tab changes
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
// watch changes in active tab
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.status === "complete") {
    if (
      tab.active &&
      !tab.url.toLowerCase().includes(currentBlockListItem?.url)
    ) {
      updatePage({
        id: tabId,
        url: tab.url,
      });
    }
  }
});

// TODO implement reset logic every day at 24:00

// TODO remove
const deleteStorage = () => {
  browser.storage.local.remove("blackList").then(() => {
    console.log("Schlüssel 'blackList' wurde gelöscht.");
  });
};

// deleteStorage();

// handle incoming request from popup script
// background-script.js
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received background");
  console.log(request);
  try {
    if (request.msg === "getBlackListItem") {
      sendResponse({ response: "pong" });
    }
  } catch (error) {
    console.error("Fehler im onMessage-Listener:", error);
  }
});
