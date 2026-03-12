// main function
document.addEventListener("DOMContentLoaded", async () => {
  // TODO remove
  // display current tab
  let currentTab = await getCurrentTab();
  let currentDetailEl;
  console.log(currentTab);
  const tabInfoElement = document.getElementById("tab-info");
  const blackListItemEl = document.getElementById("black-list-item");
  const blackListEl = document.getElementById("black-list");

  tabInfoElement.innerHTML = `
            <p>${currentTab.title}</p>
        `;
  const res = await requestCurrentBlackListData();
  console.log(res);
  if (res) {
    blackListItemEl.innerHTML =
      res.remainingTime >= 0
        ? `
        <p>${formatTime(res.remainingTime)}</p>
    `
        : `<p>Die Zeit ist für heute aufgebraucht!</p>`;
    let remainingTime = res.remainingTime;

    const updateInterval = setInterval(() => {
      if (remainingTime <= 0) return;
      remainingTime--;
      blackListItemEl.innerHTML = `
        <p>${formatTime(remainingTime)}</p>
    `;
      if (remainingTime <= 0) {
        clearInterval(updateInterval);
      }
    }, 1000);
  }

  // load black list elements from storage
  browser.storage.local.get("blackList").then((result) => {
    console.log(result);
    blackListEl.innerHTML = result.blackList.map(
      (item) => `
      <tr>
        <td>${item.url}</td>
        <td>${formatTime(item.allowedDuration)}</td>
        <td>          
          <button class="edit-btn" data-id="${item.id}">✏️</button>
        </td>
        <td>
          <button class="delete-btn" data-id="${item.id}">🗑️</button>
        </td>
      </tr>
        `,
    );

    // Event Listener nach dem Rendern setzen
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        // deleteBlackListItem(id);
      });
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        console.log("button clicked");
        const id = e.target.dataset.id;
        editBlackListItem(id);
      });
    });
  });
});

// load blacklist elements
const navigate = (pageId) => {
  document
    .querySelectorAll("[id^='page-']")
    .forEach((p) => p.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
};

// elements
const saveButton = document.getElementById("saveButton");
const pageInput = document.getElementById("page");
const homeBtn = document.getElementById("home-btn");
const listBtn = document.getElementById("list-btn");
const elUrl = document.getElementById("el-url");
const elHours = document.getElementById("el-hours");
const elMinutes = document.getElementById("el-minutes");

// Daten zur Liste hinzufügen

// handle add url to blacklist
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

// handle click home btn
homeBtn.addEventListener("click", () => {
  navigate("page-home");
});
// handle click list btn
listBtn.addEventListener("click", () => {
  navigate("page-blacklist");
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

const editBlackListItem = (id) => {
  browser.storage.local.get("blackList").then((result) => {
    currentDetailEl = result.blackList.find((el) => el.id === id);
    console.log(id);
    console.log(currentDetailEl);
    if (currentDetailEl) {
      // Element gefunden, z.B. Edit-Form befüllen
      document.getElementById("el-url").value = currentDetailEl.url;
      document.getElementById("el-hours").value = formatTime(
        currentDetailEl.allowedDuration,
        "hours",
      );
      document.getElementById("el-minutes").value = formatTime(
        currentDetailEl.allowedDuration,
        "minutes",
      );
      navigate("page-detail");
    }
  });
};

function formatTime(seconds, format = "full") {
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  const pad = (n) => n.toString().padStart(2, "0");

  switch (format) {
    case "seconds":
      return `${pad(secs)}`;

    case "minutes":
      return `${pad(minutes)}`;

    case "hours":
      return `${pad(hours)}`;

    case "hours-minutes":
      return `${pad(hours)}:${pad(minutes)}`;

    case "full":
    default:
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
}
