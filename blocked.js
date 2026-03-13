import { formatTime } from "./formatTime.js";

console.log("Hi from blocked");

const currentUrlEl = document.getElementById("current-url");
const currentTimeEl = document.getElementById("daily-timelimit");

// get current blacklist element details
browser.storage.local.get("blackList").then((result) => {
  if (!result.blackList) return;

  // get id from query params
  const params = new URLSearchParams(window.location.search);
  const blockedSiteId = params.get("id");

  if (blockedSiteId) {
    const matchedItem = result.blackList.find(
      (element) => element.id === blockedSiteId,
    );
    currentUrlEl.innerHTML = `${matchedItem.url}`;
    currentTimeEl.innerHTML = `${formatTime(matchedItem.allowedDuration, "hours-minutes")} (hh:mm)`;
    console.log(matchedItem);
  }
});
