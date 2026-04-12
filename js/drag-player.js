const playerBody = document.querySelector(".iBody");

if (playerBody) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  const interactiveSelector = [
    ".iWheel",
    ".iWheelZone",
    ".iWheelCenter",
    ".cardBtn",
    "[data-role='volume-button']",
    "button"
  ].join(",");

  function px(n) {
    return `${Math.round(n)}px`;
  }

  function onPointerDown(e) {
    const target = e.target;

    if (target.closest(interactiveSelector)) {
      return;
    }

    dragging = true;
    playerBody.classList.add("is-dragging");

    const rect = playerBody.getBoundingClientRect();

    playerBody.style.transform = "none";
    playerBody.style.left = px(rect.left);
    playerBody.style.top = px(rect.top);

    originLeft = rect.left;
    originTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    playerBody.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    playerBody.style.left = px(originLeft + dx);
    playerBody.style.top = px(originTop + dy);
  }

  function onPointerUp(e) {
    if (!dragging) return;

    dragging = false;
    playerBody.classList.remove("is-dragging");
    playerBody.releasePointerCapture?.(e.pointerId);
  }

  playerBody.addEventListener("pointerdown", onPointerDown);
  playerBody.addEventListener("pointermove", onPointerMove);
  playerBody.addEventListener("pointerup", onPointerUp);
  playerBody.addEventListener("pointercancel", onPointerUp);
}
