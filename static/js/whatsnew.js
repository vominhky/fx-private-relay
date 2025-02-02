(function() {
  const trigger = document.querySelector(".js-whatsnew-trigger");
  const counterPill = document.querySelector(".js-whatsnew-trigger-pill");
  const popup = document.querySelector(".js-whatsnew-popup");
  const whatsNewList = document.querySelector(".js-whatsnew-list");
  const footer = document.querySelector(".js-whatsnew-footer");
  const backButton = footer.querySelector("button");
  const profileId = popup.dataset.profileId;
  const browserIsFirefox = /firefox|FxiOS/i.test(navigator.userAgent);

  enableEntry("size-limit");
  if (popup.dataset.hasPremium === "True") {
    enableEntry("forward-some");
  }
  // Wait until the add-on has initialised:
  setTimeout(() => {
    const isAddonPresent = document.querySelector("firefox-private-relay-addon")?.dataset.addonInstalled === "true";
    // Only show sign-back in news item if the user is in Firefox AND has the add-on installed
    if (isAddonPresent && browserIsFirefox) {
      enableEntry("sign-back-in")
    }
  }, 500)

  trigger.addEventListener("click", (event) => {
    const close = () => {
      popup.classList.remove("is-visible");
      trigger.classList.remove("is-open");
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKeyPress);
    };
    /** @param event {KeyboardEvent} */
    const onKeyPress = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };

    if (trigger.classList.contains("is-open")) {
      close();
      return;
    }

    popup.classList.add("is-visible");
    trigger.classList.add("is-open");

    event.stopImmediatePropagation();
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKeyPress);
  });
  backButton.addEventListener("click", (event) => {
    // Prevent the event listener on the window, which closes the popup,
    // from being emitted:
    event.stopImmediatePropagation();
    const contentElements = document.querySelectorAll(".js-whatsnew-content");
    contentElements.forEach((element) => {
      element.classList.remove("is-visible");
    });
    footer.classList.remove("is-visible");
    whatsNewList.classList.remove("is-hidden");
  });

  function incrementPill() {
    const oldValue = parseInt(counterPill.textContent, 10);
    counterPill.textContent = oldValue + 1;
    counterPill.classList.add("is-visible");
  }
  function decrementPill() {
    const oldValue = parseInt(counterPill.textContent, 10);
    const newValue = oldValue - 1;
    counterPill.textContent = newValue;
    if (newValue === 0) {
      counterPill.classList.remove("is-visible");
    }
  }

  function enableEntry(id) {
    const listitem = document.querySelector(`.js-whatsnew-listitem-${id}`)
    const toggleButton = listitem.getElementsByTagName("button")[0];
    const cookieKey = `whatsnew-feature_${id}_${profileId}_dismissed`;

    listitem.classList.add("is-visible");
    if (document.cookie.indexOf(cookieKey) === -1) {
      incrementPill();
    }

    toggleButton.addEventListener("click", (event) => {
      // Prevent the event listener on the window, which closes the popup,
      // from being emitted:
      event.stopImmediatePropagation();
      displayContent(id);
      if (document.cookie.indexOf(cookieKey) === -1) {
        document.cookie = `${cookieKey}=${Date.now()}; path=/; samesite=lax; secure`;
        decrementPill();
      }
    });
  }
  function displayContent(id) {
    whatsNewList.classList.add("is-hidden");
    const content = document.querySelector(`.js-whatsnew-content-${id}`)
    content.classList.add("is-visible");
    footer.classList.add("is-visible");
  }
})();