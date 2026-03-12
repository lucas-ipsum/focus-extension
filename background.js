// ### Settings ###
const interval = 5; // interval in seconds

let countdownInterval;
let remainingTime;
let currentBlockListItem;

const startBlackListTimer = async (blackListObj) => {
  clearInterval(countdownInterval); // clear interval if still running
  remainingTime = blackListObj.remainingTime;
  currentBlockListItem = blackListObj;

  // start countdown interval
  countdownInterval = setInterval(async () => {
    remainingTime = remainingTime - interval;
    currentBlockListItem.remainingTime = remainingTime;
    console.log(
      `Du hast heute noch ${remainingTime} Sekunden auf ${blackListObj.url} übrig.`,
    );

    if (remainingTime <= 0) {
      console.log("Daily limit reached:");
      clearInterval(countdownInterval);
      const currentTab = await getCurrentTab();
      await browser.tabs.update(currentTab.id, {
        url: `blocked.html?id=${blackListObj.id}`,
      });
    }
  }, interval * 1000);
};

const stopBlackListTimer = () => {
  clearInterval(countdownInterval);
  if (!currentBlockListItem) return;
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
  if (!page?.url) return;
  // get black list from local storage and check if currently viewed page is on list
  browser.storage.local.get("blackList").then((result) => {
    if (!result.blackList) return;

    const matchedItem = result.blackList.find((element) =>
      page.url.toLowerCase().includes(element.url.toLowerCase()),
    );
    console.log(matchedItem);
    if (matchedItem) {
      if (matchedItem.remainingTime >= 0) {
        // only restart time if changed to different black list page
        if (currentBlockListItem?.id !== matchedItem.id) {
          startBlackListTimer(matchedItem);
        }
      } else if (matchedItem.remainingTime <= 0) {
        currentBlockListItem = matchedItem;
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

browser.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    // no current focus
    stopBlackListTimer();
  }
  browser.tabs.query({ active: true, windowId }).then(([tab]) => {
    console.log("Aktiver Tab im fokussierten Fenster:", tab);
    checkBlackList(tab);
  });
});

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
      sendResponse(currentBlockListItem);
    }
  } catch (error) {
    console.error("Fehler im onMessage-Listener:", error);
  }
});

// reset timer
const resetDailyLimit = () => {
  console.log("reset daily limit");
  browser.storage.local.get("blackList").then((result) => {
    const pages = result.blackList || [];
    for (let i = 0; i < pages.length; i++) {
      pages[i].remainingTime = pages[i].allowedDuration;
    }
    browser.storage.local.set({ blackList: pages });
  });
};

const getNext6AM = () => {
  const now = new Date();
  const next6AM = new Date();
  next6AM.setHours(6, 0, 0, 0);

  // Falls 6 Uhr heute schon vorbei ist, auf morgen setzen
  if (now >= next6AM) {
    next6AM.setDate(next6AM.getDate() + 1);
  }

  return next6AM.getTime();
};

browser.alarms.create("dailyReset", {
  when: getNext6AM(),
  periodInMinutes: 24 * 60,
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyReset") {
    resetDailyLimit();
  }
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
